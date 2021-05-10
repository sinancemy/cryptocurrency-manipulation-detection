import atexit
import threading
import time
from datetime import datetime
from typing import Optional

import requests
from flask import Blueprint, request
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import desc

from backend.processor.aggregate_post_count import create_streamed_aggregate_post_counts
from data.collector.twitter import COIN_KEYWORDS
from data.database import db, StreamedPost, StreamedAggregatePostCount
from misc import CoinType, TimeRange

STREAM_UPDATE_TIME = 60

stream_blueprint = Blueprint("stream", __name__)
update_lock = threading.Lock()


def parse_twitter_post(user, content) -> iter:
    curr_time = int(time.time())
    post_info = []
    for coin, keywords in COIN_KEYWORDS.items():
        for keyword in keywords:
            if "#" + keyword in content:
                post_info.append((coin, keyword))
    for coin, keyword in post_info:
        yield StreamedPost(coin_type=coin, user=user, content=content, source="twitter/" + keyword, time=curr_time)


def get_last_update_time() -> Optional[int]:
    last_calculation = StreamedAggregatePostCount.query.order_by(desc(StreamedAggregatePostCount.time)).limit(1).first()
    if last_calculation is None:
        first_post = StreamedPost.query.order_by(StreamedPost.time).limit(1).first()
        if first_post is None:
            return None
        return first_post.time
    return last_calculation.next_time


@stream_blueprint.route("/update", methods=["POST"])
def update():
    update_lock.acquire()
    coin_types = [CoinType.btc, CoinType.eth, CoinType.doge]
    # Get last update time.
    last_update = get_last_update_time()
    print("Updating from", datetime.utcfromtimestamp(last_update))
    if last_update is None:
        print("No streamed posts received yet.")
        update_lock.release()
        return "ok"
    curr_time = int(time.time())
    create_streamed_aggregate_post_counts(coin_types, [], TimeRange(last_update+1, curr_time))
    # TODO: Deploy notifications.
    db.session.commit()
    update_lock.release()
    return "ok"


# TODO: Add authentication
@stream_blueprint.route("/twitter", methods=["POST"])
def twitter_stream():
    update_lock.acquire()
    form = request.get_json()
    user = form[0]
    content = form[1]['body']
    new_posts = list(parse_twitter_post(user, content))
    db.session.bulk_save_objects(new_posts)
    db.session.commit()
    update_lock.release()
    return 'ok'


# TODO: Add authentication
@stream_blueprint.route("/reddit", methods=["POST"])
def reddit_stream():
    return "ok"


def invoke_update_endpoint():
    requests.post("http://127.0.0.1:5000/stream/update")


# cron = BackgroundScheduler(daemon=True)
# cron.add_job(invoke_update_endpoint, "interval", seconds=STREAM_UPDATE_TIME)
# cron.start()
# atexit.register(lambda: cron.shutdown(wait=False))
