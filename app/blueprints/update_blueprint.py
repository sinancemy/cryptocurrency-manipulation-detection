import time

from flask import Blueprint, request

from backend import api_settings
from backend.api_settings import GENESIS
from backend.processor.aggregate_post_count import create_aggregate_post_counts, create_streamed_aggregate_post_counts
from data.collector.reddit import ArchivedRedditCrawler, RealtimeRedditCrawler
from data.collector.twitter import TwitterCrawler
from data.collector.yahoo import YahooPriceCrawler
from data.database import Post, Price, db
from data.reader.cachedreader import CachedReader
from misc import CoinType, TimeRange

COINS = [CoinType.btc, CoinType.eth, CoinType.doge]

update_blueprint = Blueprint("update", __name__)


@update_blueprint.route("/posts", methods=["POST"])
def update_posts():
    curr_time = request.form.get("time", type=int, default=None)
    if curr_time is None:
        print("Update posts endpoint: Invalid time. Using current time.")
        curr_time = time.time()
    last_update = api_settings.get_last_epoch(default=api_settings.GENESIS)
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
            # new_posts += cr.read_cached(effective_time_range)
    # Post-processing...
    # update_impacts(new_posts)
    # groups = list(filter(lambda s: s.startswith("*"), get_all_sources()))
    # create_aggregate_post_impacts(coin_types, groups, effective_time_range)
    create_aggregate_post_counts(COINS, [], effective_time_range)
    return "ok"


@update_blueprint.route("/prices", methods=["POST"])
def update_prices():
    curr_time = request.form.get("time", type=int, default=None)
    if curr_time is None:
        print("Update prices endpoint: Invalid time. Using current time.")
        curr_time = time.time()
    last_update = api_settings.get_last_price_update(default=GENESIS)
    effective_time_range = TimeRange(last_update + 1, curr_time)
    price_reader = CachedReader(YahooPriceCrawler(resolution="1m"), Price)
    print("Update prices endpoint: Collecting new prices...")
    for coin in COINS:
        price_reader.collector.settings.coin = coin
        price_reader.read_cached(effective_time_range)
    return "ok"


@update_blueprint.route("/stream", methods=["POST"])
def update_stream():
    curr_time = request.form.get("time", type=int, default=None)
    if curr_time is None:
        print("Update stream endpoint: Invalid time. Using current time.")
        curr_time = time.time()
    # Get last update time.
    last_update = api_settings.get_last_stream_update(default=None)
    print("Update stream endpoint: Updating from", last_update)
    if last_update is None:
        print("No streamed posts received yet.")
        return "ok"
    create_streamed_aggregate_post_counts(COINS, [], TimeRange(last_update + 1, curr_time))
    # TODO: Deploy notifications.
    db.session.commit()
    return "ok"
