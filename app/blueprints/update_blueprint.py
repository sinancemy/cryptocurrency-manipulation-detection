import time

from flask import Blueprint, request

from backend import api_settings
from backend.api_settings import GENESIS
from backend.processor.aggregate_post_count import create_aggregate_post_counts, create_streamed_aggregate_post_counts
from backend.processor.notification_deployment import deploy_notifications
from data.collector.reddit import ArchivedRedditCrawler, RealtimeRedditCrawler
from data.collector.twitter import TwitterCrawler
from data.collector.yahoo import YahooPriceCrawler
from data.database import Post, Price, db
from data.reader.cachedreader import CachedReader
from misc import CoinType, TimeRange

COINS = [CoinType.btc, CoinType.eth, CoinType.doge]

update_blueprint = Blueprint("update", __name__)


@update_blueprint.route("/collect_posts", methods=["POST"])
def collect_posts():
    curr_time = request.form.get("time", type=int, default=None)
    if curr_time is None:
        print("Collect posts endpoint: Invalid time. Using current time.")
        curr_time = time.time()
    from_time = api_settings.get_last_crawled_post_time(default=api_settings.GENESIS)
    effective_time_range = TimeRange(from_time + 1, curr_time)
    print("Collect posts endpoint: Collecting new posts within", effective_time_range)
    social_media_crawlers = [TwitterCrawler(), ArchivedRedditCrawler(interval=60 * 60 * 24 * 7,
                                                                     api_settings={'limit': 2000, 'score': '>4'}),
                             RealtimeRedditCrawler()]
    cached_post_readers = list(map(lambda c: CachedReader(c, Post), social_media_crawlers))
    new_posts = []
    for coin in COINS:
        for cr in cached_post_readers:
            cr.collector.settings.coin = coin
            new_posts += cr.read_cached(effective_time_range)
    return "ok"


@update_blueprint.route("/collect_prices", methods=["POST"])
def collect_prices():
    curr_time = request.form.get("time", type=int, default=None)
    if curr_time is None:
        print("Collect prices endpoint: Invalid time. Using current time.")
        curr_time = time.time()
    from_time = api_settings.get_last_price_time(default=GENESIS)
    effective_time_range = TimeRange(from_time + 1, curr_time)
    print("Collect prices endpoint: Collecting new prices within", effective_time_range)
    price_reader = CachedReader(YahooPriceCrawler(resolution="1m"), Price)
    for coin in COINS:
        price_reader.collector.settings.coin = coin
        price_reader.read_cached(effective_time_range)
    return "ok"


@update_blueprint.route("/posts", methods=["POST"])
def update_posts():
    from_time = api_settings.get_last_aggr_post_time(default=GENESIS)
    to_time = api_settings.get_last_crawled_post_time(default=None)
    if to_time is None or from_time >= to_time:
        return "no new posts"
    effective_time_range = TimeRange(from_time + 1, to_time)
    print("Update posts endpoint: Updating within", effective_time_range)
    # groups = list(filter(lambda s: s.startswith("*"), get_all_sources()))
    # create_aggregate_post_impacts(coin_types, groups, effective_time_range)
    create_aggregate_post_counts(COINS, [], effective_time_range)
    # update_impacts(new_posts)
    return "ok"


@update_blueprint.route("/stream", methods=["POST"])
def update_stream():
    from_time = api_settings.get_last_aggr_stream_time(default=GENESIS)
    to_time = api_settings.get_last_streamed_post_time(default=None)
    if to_time is None or from_time >= to_time:
        return "no new streamed posts"
    effective_time_range = TimeRange(from_time + 1, to_time)
    print("Update stream endpoint: Updating within", effective_time_range)
    create_streamed_aggregate_post_counts(COINS, [], effective_time_range)
    # TODO: Deploy notifications.
    db.session.commit()
    return "ok"


@update_blueprint.route("/notifications", methods=["POST"])
def update_notifications():
    deploy_notifications(int(time.time()), COINS, [])

