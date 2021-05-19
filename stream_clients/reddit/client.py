import praw
import requests

CLIENT_ID = '7PKSFWfDqgf_lA'
CLIENT_SECRET = '5BLHdTaIJQT680-ZwXo1jo3xIbLOJw'
USER_AGENT = 'Crawler for Cryptocurrency Analysis'


def start():
    reddit = praw.Reddit(client_id=CLIENT_ID, client_secret=CLIENT_SECRET, user_agent=USER_AGENT)

    subreddit = reddit.subreddit(
        "Bitcoin+BTC+Ethereum+ETH+Dogecoin+cardano+chainlink+polkadot+ripple+xrp+litecoin+ltc+stellar+xlm+omise_go+omgnetwork")
    for submission in subreddit.stream.submissions():
        post = {
            "unique_id": "rs" + submission.id,
            "user": (submission.author.name if submission.author is not None else "deleted"),
            "subreddit": submission.subreddit.display_name,
            "title": submission.title,
            "selftext": submission.selftext,
            "time": int(submission.created_utc)
        }
        requests.post("http://127.0.0.1:5000/stream/reddit", json=post)


if __name__ == "__main__":
    print("Initiating the client...")
    start()
