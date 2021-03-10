import praw
import pandas as pd
from praw.models import MoreComments
import threading
import datetime
import pytz

# bunlari sonra acariz
# coins = ["Bitcoin", "BTC", "btc", "Ethereum", "ETH", "eth", "Dogecoin", "DOGE", "doge", "Cardano", "ADA", "ada", "Chainlink", "LINK", "link", "Polkadot", "DOT", "dot", "Binance coin", "BNB", "bnb", "Ripple", "XRP", "xrp", "OMG Network", "OMG", "omg", "Litecoin", "LTC", "ltc", "Stellar", "XLM", "xlm", "Basic Attraction Token", "BAT", "bat", "Avalanche", "AVAX", "avax", "Ravencoin", "RVN", "rvn", "Maker", "MKR", "mkr", "Chiliz", "CHZ", "chz"]

coins = ["Bitcoin", "Doge"]


def get_reddit():
    # timer ayarla
    threading.Timer(10.0, get_reddit).start()
    reddit = praw.Reddit(client_id='7PKSFWfDqgf_lA', client_secret='5BLHdTaIJQT680-ZwXo1jo3xIbLOJw',
                         user_agent='Crawler for Cryptocurrency Analysis')
    posts = []
    for coin in coins:
        coin_subreddit = reddit.subreddit(coin)
        # limit degistir
        for post in coin_subreddit.hot(limit=10):
            posts.append([post.title, post.score, post.id, post.subreddit, post.url, post.num_comments, post.selftext,
                          int(post.created)])
            submission = reddit.submission(id=post.id)
            for top_level_comment in submission.comments:
                if isinstance(top_level_comment, MoreComments):
                    continue
                posts.append([top_level_comment.body, '', '', '', '', '', '', int(top_level_comment.created)])
    pd.DataFrame(posts, columns=['title', 'score', 'id', 'subreddit', 'url', 'num_comments', 'body', 'created']).to_csv(
        "reddit.csv")
    print("Done!")


def get_date(submission):
    time = submission.created
    return datetime.datetime.fromtimestamp(time)


get_reddit()
