import functools

import praw
from praw.models import MoreComments
from psaw import PushshiftAPI

from data.collector import Collector
from data.database.data_models import Post
from misc import *

import warnings

warnings.filterwarnings("ignore")

# coins = ["Bitcoin", "BTC", "btc", "Ethereum", "ETH", "eth", "Dogecoin", "DOGE", "doge",
# "Cardano", "ADA", "ada", "Chainlink", "LINK", "link", "Polkadot", "DOT", "dot", "Binance coin", "BNB", "bnb",
# "Ripple", "XRP", "xrp", "OMG Network", "OMG", "omg", "Litecoin", "LTC", "ltc", "Stellar", "XLM", "xlm",
# "Basic Attraction Token", "BAT", "bat", "Avalanche", "AVAX", "avax", "Ravencoin", "RVN", "rvn", "Maker", "MKR",
# "mkr", "Chiliz", "CHZ", "chz"]

# Maps a coin type to the subreddits to look for.
COIN_SUBREDDITS = {
    CoinType.btc: ["Bitcoin", "BTC"],
    CoinType.eth: ["Ethereum", "ETH"],
    CoinType.doge: ["Dogecoin"],
    CoinType.ada: ["cardano"],
    CoinType.link: ["chainlink"],
    CoinType.dot: ["polkadot"],
    CoinType.xrp: ["ripple", "xrp"],
    CoinType.ltc: ["litecoin", "ltc"],
    CoinType.xlm: ["stellar", "xlm"],
    CoinType.omg: ["omise_go", "omgnetwork"],
}

# PRAW STUFF
CLIENT_ID = '7PKSFWfDqgf_lA'
CLIENT_SECRET = '5BLHdTaIJQT680-ZwXo1jo3xIbLOJw'
USER_AGENT = 'Crawler for Cryptocurrency Analysis'
DEFAULT_PRAW_SUBMISSION_LIMIT = 10000


def calculate_interaction_score(num_comments, score):
    return num_comments + score


class RealtimeRedditCrawler(Collector):

    def __init__(self, coin: CoinType = CoinType.btc, limit: int = DEFAULT_PRAW_SUBMISSION_LIMIT, collect_comments=False):
        super().__init__(coin=coin, limit=limit, collect_comments=collect_comments)
        self.spider = praw.Reddit(client_id=CLIENT_ID, client_secret=CLIENT_SECRET,
                                  user_agent=USER_AGENT)

    @staticmethod
    def get_all_sources() -> list:
        return ["*@reddit/" + s for s in functools.reduce(list.__add__, COIN_SUBREDDITS.values())]

    def collect(self, time_range: TimeRange) -> list:
        posts = []
        for subreddit in COIN_SUBREDDITS[self.settings.coin]:
            posts += self.collect_posts_from_subreddit(subreddit, self.settings.coin, time_range, self.settings.limit)
        return posts

    def collect_posts_from_subreddit(self, subreddit: str, coin: CoinType, time_range: TimeRange, limit: int):
        print("RedditCrawler:", "Collecting from", subreddit, "with time range", time_range)
        posts = []
        coin_subreddit = self.spider.subreddit(subreddit)
        for submission in coin_subreddit.new(limit=limit):
            created_time = int(submission.created_utc)
            if time_range.is_higher(created_time):
                continue
            if time_range.is_lower(created_time):
                break
            print("RedditCrawler:", "Found post", submission.title, "with time", time_to_str(created_time))
            interaction_score = calculate_interaction_score(submission.num_comments, submission.score)
            subreddit_source = "reddit/" + submission.subreddit.display_name
            # Concatenate the title and the contents of the post.
            submission_text = submission.title + submission.selftext
            submission_model = Post(unique_id="rs" + submission.id,
                                    user=(submission.author.name if submission.author is not None else "deleted"),
                                    content=submission_text, interaction=interaction_score, source=subreddit_source,
                                    time=created_time, coin_type=coin)
            posts.append(submission_model)
            submission = self.spider.submission(id=submission.id)
            # Expand the comments.
            submission.comments.replace_more(limit=3)
            if not self.settings.collect.comments:
                continue
            # Iterate over all the comments.
            for top_comment in submission.comments.list():
                if isinstance(top_comment, MoreComments):
                    continue
                # Discard the comments with no content and deleted comments.
                if top_comment.body is None or top_comment.author is None or top_comment.body.strip() == '':
                    continue
                comment_interaction_score = calculate_interaction_score(len(top_comment.replies), top_comment.score)
                comment_model = Post(unique_id="rc" + top_comment.id,
                                     user=(top_comment.author.name if top_comment.author is not None else "deleted"),
                                     content=top_comment.body, interaction=comment_interaction_score,
                                     source=subreddit_source, time=top_comment.created_utc, coin_type=coin)
                posts.append(comment_model)
        return posts


class ArchivedRedditCrawler(Collector):

    def __init__(self, interval, api_settings, coin: CoinType = CoinType.btc, collect_comments=False):
        super().__init__(coin=coin, api_settings=api_settings, interval=interval, collect_comments=collect_comments)
        self.api = PushshiftAPI()

    @staticmethod
    def get_all_sources() -> list:
        return ["*@reddit/" + s for s in functools.reduce(list.__add__, COIN_SUBREDDITS.values())]

    def collect(self, time_range: TimeRange):
        for t in range(time_range.low, time_range.high + 1, self.settings.interval):
            tr = TimeRange(t, min(t + self.settings.interval, time_range.high))
            print("ArchivedRedditCrawler: Reading within", tr)
            for subreddit in COIN_SUBREDDITS[self.settings.coin.value]:
                sbm = self.api.search_submissions(subreddit=subreddit, before=tr.high, after=tr.low,
                                                  **self.settings.api_settings)
                for p in sbm:
                    content = p.title + (" " + p.selftext if hasattr(p, 'selftext') else "")
                    yield Post(coin_type=self.settings.coin, user=p.author, content=content, source="reddit/" + subreddit,
                               interaction=calculate_interaction_score(p.num_comments, p.score), time=p.created_utc,
                               unique_id="rs" + p.id)
                # Skip collecting the comments.
                if not self.settings.collect_comments:
                    continue
                cmt = self.api.search_comments(subreddit=subreddit, before=tr.high, after=tr.low,
                                               **self.settings.api_settings)
                for p in cmt:
                    yield Post(coin_type=self.settings.coin, user=p.author, content=p.body, source="reddit/" + subreddit,
                               interaction=calculate_interaction_score(0, p.score), time=p.created_utc, unique_id="rc" + p.id)
