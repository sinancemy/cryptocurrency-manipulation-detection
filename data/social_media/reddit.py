import praw
from praw.models import MoreComments
import time
import psaw
from psaw import PushshiftAPI

from data.crawler import SocialMediaCrawler
from data.database.database import Database
from data.database.models import Post
from data.misc.misc import *
import itertools

# bunlari sonra acariz
# coins = ["Bitcoin", "BTC", "btc", "Ethereum", "ETH", "eth", "Dogecoin", "DOGE", "doge", "Cardano", "ADA", "ada", "Chainlink", "LINK", "link", "Polkadot", "DOT", "dot", "Binance coin", "BNB", "bnb", "Ripple", "XRP", "xrp", "OMG Network", "OMG", "omg", "Litecoin", "LTC", "ltc", "Stellar", "XLM", "xlm", "Basic Attraction Token", "BAT", "bat", "Avalanche", "AVAX", "avax", "Ravencoin", "RVN", "rvn", "Maker", "MKR", "mkr", "Chiliz", "CHZ", "chz"]

# Maps a coin type to the subreddits to look for.
COIN_SUBREDDITS = {
    CoinType.BTC: ["Bitcoin", "BTC"],
    CoinType.ETH: ["Ethereum", "ETH"],
    CoinType.DOGE: ["Dogecoin"]
}

# PRAW STUFF
CLIENT_ID = '7PKSFWfDqgf_lA'
CLIENT_SECRET = '5BLHdTaIJQT680-ZwXo1jo3xIbLOJw'
USER_AGENT = 'Crawler for Cryptocurrency Analysis'
DEFAULT_PRAW_SUBMISSION_LIMIT = 10000


def calculate_interaction_score(num_comments, score):
    return num_comments + score


class RealtimeRedditCrawler(SocialMediaCrawler):

    def __init__(self):
        self.spider = praw.Reddit(client_id=CLIENT_ID, client_secret=CLIENT_SECRET,
                                  user_agent=USER_AGENT)

    def collect_posts_from_subreddit(self, subreddit: str, coin: CoinType, time_range: TimeRange,
                                     limit: int = DEFAULT_PRAW_SUBMISSION_LIMIT):
        print("RedditCrawler:", "Collecting from", subreddit, "with time range", time_range)
        posts = []
        coin_subreddit = self.spider.subreddit(subreddit)
        for i, submission in enumerate(coin_subreddit.new(limit=limit)):
            created_time = int(submission.created_utc)
            print(i, created_time)
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

    def collect_posts(self, coin: CoinType, time_range: TimeRange, limit: int = DEFAULT_PRAW_SUBMISSION_LIMIT):
        posts = []
        for subreddit in COIN_SUBREDDITS[coin]:
            posts += self.collect_posts_from_subreddit(subreddit, coin, time_range, limit)
        return posts


class ArchivedRedditCrawler(SocialMediaCrawler):
    def __init__(self, limit_per_month=750):
        self.api = PushshiftAPI()
        self.limit_per_month = limit_per_month

    def collect_posts(self, coin: CoinType, time_range: TimeRange, limit: int = -1):
        # One month interval.
        interval = 60 * 60 * 24 * 30
        # Use the limit-per-month defined in the constructor (if not explicitly specified)
        if limit == -1:
            limit = self.limit_per_month

        posts = []
        for t in range(time_range.low, time_range.high + 1, interval):
            tr = TimeRange(t, min(t + interval, time_range.high))
            print("ArchivedRedditCrawler: Reading within", tr)
            for subreddit in COIN_SUBREDDITS[coin.value]:
                submissions = self.api.search_submissions(subreddit=subreddit, before=tr.high, after=tr.low,
                                                          limit=limit)
                comments = self.api.search_comments(subreddit=subreddit, before=tr.high, after=tr.low, limit=limit)
                posts += [*itertools.chain(map(lambda p: Post(coin, p.author,
                                                              p.title,
                                                              "reddit/" + subreddit,
                                                              calculate_interaction_score(p.num_comments, p.score),
                                                              p.created_utc, p.id), submissions),
                                           map(lambda p: Post(coin, p.author,
                                                              p.body,
                                                              "reddit/" + subreddit,
                                                              calculate_interaction_score(0, p.score),
                                                              p.created_utc, p.id), comments))]
        return posts
