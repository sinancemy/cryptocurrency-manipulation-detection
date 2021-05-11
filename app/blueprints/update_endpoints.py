import time
from datetime import datetime
from typing import Optional

from sqlalchemy import desc

from app.blueprints.api_blueprint import api_blueprint, request
from app.blueprints.stream_blueprint import stream_blueprint, stream_update_lock
from backend.processor.aggregate_post_count import create_aggregate_post_counts, create_streamed_aggregate_post_counts
from data.collector.reddit import ArchivedRedditCrawler, RealtimeRedditCrawler
from data.collector.twitter import TwitterCrawler
from data.collector.yahoo import YahooPriceCrawler
from data.database import Post, StreamedAggregatePostCount, StreamedPost, Price, db
from data.reader.cachedreader import CachedReader
from misc import CoinType, TimeRange

START_TIME = 1615386994
COINS = [CoinType.btc, CoinType.eth, CoinType.doge]


def get_last_post_time() -> Optional[int]:
    last_post = Post.query.order_by(desc(Post.time)).limit(1).first()
    if last_post is None:
        return None
    return last_post.time


def get_last_price_time() -> Optional[int]:
    last_price = Price.query.order_by(desc(Price.time)).limit(1).first()
    if last_price is None:
        return None
    return last_price.time


def get_last_stream_update_time() -> Optional[int]:
    last_calculation = StreamedAggregatePostCount.query.order_by(desc(StreamedAggregatePostCount.time)).limit(1).first()
    if last_calculation is None:
        first_post = StreamedPost.query.order_by(StreamedPost.time).limit(1).first()
        if first_post is None:
            return None
        return first_post.time
    return last_calculation.next_time


@api_blueprint.route("/update_posts", methods=["POST"])
def update_posts():
    curr_time = request.form.get("time", type=int, default=None)
    if curr_time is None:
        print("Update posts endpoint: Invalid time. Using current time.")
        curr_time = time.time()
    last_update = get_last_post_time()
    if last_update is None:
        last_update = START_TIME
    social_media_crawlers = [TwitterCrawler(), ArchivedRedditCrawler(interval=60 * 60 * 24 * 7,
                                                                     api_settings={'limit': 2000, 'score': '>4'}),
                             RealtimeRedditCrawler()]
    cached_post_readers = list(map(lambda c: CachedReader(c, Post), social_media_crawlers))
    effective_time_range = TimeRange(last_update + 1, curr_time)
    print("Update posts endpoint: Collecting new posts...")
    new_posts = []
    for coin in COINS:
        for cr in cached_post_readers:
            cr.collector.settings.coin = coin
            new_posts += cr.read_cached(effective_time_range)
    # Post-processing...
    # update_impacts(new_posts)
    # groups = list(filter(lambda s: s.startswith("*"), get_all_sources()))
    # create_aggregate_post_impacts(coin_types, groups, effective_time_range)
    create_aggregate_post_counts(COINS, [], effective_time_range)
    return "ok"


@api_blueprint.route("/update_prices", methods=["POST"])
def update_prices():
    curr_time = request.form.get("time", type=int, default=None)
    if curr_time is None:
        print("Update prices endpoint: Invalid time. Using current time.")
        curr_time = time.time()
    last_update = get_last_price_time()
    if last_update is None:
        last_update = START_TIME
    effective_time_range = TimeRange(last_update + 1, curr_time)
    price_reader = CachedReader(YahooPriceCrawler(resolution="1m"), Price)
    print("Update prices endpoint: Collecting new prices...")
    for coin in COINS:
        price_reader.collector.settings.coin = coin
        price_reader.read_cached(effective_time_range)
    return "ok"


@stream_blueprint.route("/update", methods=["POST"])
def update_stream():
    curr_time = request.form.get("time", type=int, default=None)
    if curr_time is None:
        print("Update stream endpoint: Invalid time. Using current time.")
        curr_time = time.time()
    stream_update_lock.acquire()
    # Get last update time.
    last_update = get_last_stream_update_time()
    print("Update stream endpoint: Updating from", last_update)
    if last_update is None:
        print("No streamed posts received yet.")
        stream_update_lock.release()
        return "ok"
    create_streamed_aggregate_post_counts(COINS, [], TimeRange(last_update + 1, curr_time))
    # TODO: Deploy notifications.
    db.session.commit()
    stream_update_lock.release()
    return "ok"
