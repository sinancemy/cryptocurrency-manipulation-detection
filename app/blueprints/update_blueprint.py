import time

from flask import Blueprint, request, current_app

from backend import api_settings
from backend.api_settings import GENESIS
from backend.processor.aggregate_post_count import create_aggregate_post_counts, create_streamed_aggregate_post_counts
from backend.processor.mail_deployment import Mailer
from backend.processor.notification_deployment import deploy_notifications
from backend.processor.predictor import update_post_impacts
from data.collector.reddit import ArchivedRedditCrawler, RealtimeRedditCrawler
from data.collector.reddit.multiplexer import RedditMultiplexedCrawler
from data.collector.twitter import TwitterCrawler
from data.collector.yahoo import YahooPriceCrawler
from data.database import Post, Price, db
from data.reader.uncachedreader import UncachedReader
from misc import CoinType, TimeRange, delta_time

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
    archived_reddit_crawler = ArchivedRedditCrawler(interval=delta_time.days(1), api_settings={'limit': 2000})
    realtime_reddit_crawler = RealtimeRedditCrawler()
    social_media_crawlers = [TwitterCrawler(), RedditMultiplexedCrawler(delta_time.days(2), realtime_reddit_crawler,
                                                                        archived_reddit_crawler)]
    cached_post_readers = list(map(lambda c: UncachedReader(c, Post, save_interval=delta_time.days(10)),
                                   social_media_crawlers))
    new_posts = []
    for coin in COINS:
        print("Collect posts endpoint: Switching coin to", coin.value)
        for cr in cached_post_readers:
            cr.collector.update_coin(coin)
            new_posts += cr.read_uncached(effective_time_range)
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

    print(effective_time_range)
    old_threshold = int(time.time()) - delta_time.days(5)
    if effective_time_range.in_range(old_threshold):

        old_effective_time_range = TimeRange(effective_time_range.low, old_threshold + 5)
        effective_time_range = TimeRange(old_threshold + 5, effective_time_range.high)
        print("old effective", old_effective_time_range)
        print("new effective", effective_time_range)

        old_price_reader = UncachedReader(YahooPriceCrawler(resolution="1h"), Price, dynamic_low=False)
        for coin in COINS:
            old_price_reader.collector.update_coin(coin)
            old_price_reader.read_uncached(old_effective_time_range)
    price_reader = UncachedReader(YahooPriceCrawler(resolution="1m"), Price, dynamic_low=False)
    for coin in COINS:
        price_reader.collector.update_coin(coin)
        price_reader.read_uncached(effective_time_range)
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
    update_post_impacts(effective_time_range)
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
    mailer = Mailer(current_app)
    deploy_notifications(int(time.time()), COINS, [], mailer)
    return "ok"
