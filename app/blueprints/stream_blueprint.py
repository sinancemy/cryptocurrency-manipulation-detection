import time
from typing import Optional

from flask import Blueprint, request

from data.collector.reddit import COIN_SUBREDDITS
from data.collector.twitter import COIN_KEYWORDS
from data.database import db, StreamedPost

stream_blueprint = Blueprint("stream", __name__)


def parse_twitter_post(user, content) -> iter:
    curr_time = int(time.time())
    post_info = []
    for coin, keywords in COIN_KEYWORDS.items():
        for keyword in keywords:
            if "#" + keyword in content:
                post_info.append((coin, keyword))
    for coin, keyword in post_info:
        yield StreamedPost(coin_type=coin, user=user, content=content, source="twitter/" + keyword.lower(),
                           time=curr_time)


# TODO: Add authentication
@stream_blueprint.route("/twitter", methods=["POST"])
def twitter_stream():
    form = request.get_json()
    user = form[0]
    content = form[1]['body']
    new_posts = list(parse_twitter_post(user, content))
    db.session.bulk_save_objects(new_posts)
    db.session.commit()
    return 'ok'


def parse_reddit_post(post_dict) -> Optional[StreamedPost]:
    for coin, subreddits in COIN_SUBREDDITS.items():
        if post_dict["subreddit"].lower() in [s.lower() for s in subreddits]:
            return StreamedPost(coin_type=coin, user=post_dict["user"],
                                content=post_dict["title"] + " " + post_dict["selftext"],
                                source="reddit/" + post_dict["subreddit"].lower(), time=int(post_dict["time"]))
    return None


# TODO: Add authentication
@stream_blueprint.route("/reddit", methods=["POST"])
def reddit_stream():
    form = request.get_json()
    streamed_post = parse_reddit_post(form)
    if streamed_post is None:
        return "ok"
    db.session.add(streamed_post)
    db.session.commit()
    return "ok"
