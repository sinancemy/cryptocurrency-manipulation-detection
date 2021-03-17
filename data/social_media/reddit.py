import praw
from praw.models import MoreComments
import time

from data.crawler import SocialMediaCrawler
from data.database.models import Post
from data.misc.misc import *

# bunlari sonra acariz
# coins = ["Bitcoin", "BTC", "btc", "Ethereum", "ETH", "eth", "Dogecoin", "DOGE", "doge", "Cardano", "ADA", "ada", "Chainlink", "LINK", "link", "Polkadot", "DOT", "dot", "Binance coin", "BNB", "bnb", "Ripple", "XRP", "xrp", "OMG Network", "OMG", "omg", "Litecoin", "LTC", "ltc", "Stellar", "XLM", "xlm", "Basic Attraction Token", "BAT", "bat", "Avalanche", "AVAX", "avax", "Ravencoin", "RVN", "rvn", "Maker", "MKR", "mkr", "Chiliz", "CHZ", "chz"]

# Maps a coin type to the subreddits to look for.
COIN_SUBREDDITS = {
    CoinType.BTC: ["Bitcoin", "BTC", "btc"],
    CoinType.ETH: ["Ethereum", "ETH", "eth"],
    CoinType.DOGE: ["Dogecoin", "DOGE", "doge"]
}

CLIENT_ID = '7PKSFWfDqgf_lA'
CLIENT_SECRET = '5BLHdTaIJQT680-ZwXo1jo3xIbLOJw'
USER_AGENT = 'Crawler for Cryptocurrency Analysis'
DEFAULT_LIMIT = 1000


def calculate_interaction_score(num_comments, score):
    return num_comments + score


class RedditCrawler(SocialMediaCrawler):

    def __init__(self):
        self.spider = praw.Reddit(client_id=CLIENT_ID, client_secret=CLIENT_SECRET,
                                  user_agent=USER_AGENT)

    def collect_posts_from_subreddit(self, subreddit: str, time_range: TimeRange, limit: int = DEFAULT_LIMIT):
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
            submission_model = Post("rs" + submission.id, submission.author.name, submission_text,
                                    interaction_score,
                                    subreddit_source, created_time)
            posts.append(submission_model)
            submission = self.spider.submission(id=submission.id)
            # Expand the comments once.
            submission.comments.replace_more(limit=1)
            # Iterate over all the comments.
            for top_comment in submission.comments.list():
                if isinstance(top_comment, MoreComments):
                    continue
                # Discard the comments with no content and deleted comments.
                if top_comment.body is None or top_comment.author is None or top_comment.body.strip() == '':
                    continue
                comment_interaction_score = calculate_interaction_score(len(top_comment.replies), top_comment.score)
                comment_model = Post("rc" + top_comment.id, top_comment.author.name, top_comment.body,
                                     comment_interaction_score,
                                     subreddit_source, top_comment.created_utc)
                posts.append(comment_model)
        return posts

    def collect_posts(self, coin: CoinType, time_range: TimeRange, limit: int = DEFAULT_LIMIT):
        posts = []
        for subreddit in COIN_SUBREDDITS[coin]:
            posts += self.collect_posts_from_subreddit(subreddit, time_range, limit)
        return posts



# Testing
rc = RedditCrawler()
rc.collect_posts(CoinType.BTC, TimeRange(int(time.time() - 60 * 60 * 5), int(time.time() - 60 * 60 * 2)))
