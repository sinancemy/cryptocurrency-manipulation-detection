from sqlalchemy import desc

from data.database import db, Post, Price, StreamedPost
from data.database.aggregate_models import StreamedAggregatePostCount, AggregatePostCount
from misc import delta_time

GENESIS = 1615386994

POST_COUNT_INTERVAL = 60
STREAMED_POST_COUNT_INTERVAL = 20

EXTENT_TO_SECONDS = {
    "6h": delta_time.hours(6),
    "1d": delta_time.days(1),
    "1w": delta_time.days(7),
    "1m": delta_time.days(30),
    "1y": delta_time.days(365),
}

EXTENT_TO_DEFAULT_SMA = {
    "6h": "1m",
    "1d": "4m",
    "1w": "30m",
    "1m": "2h",
    "1y": "1d"
}

SMA_TO_SECONDS = {
    "1m": delta_time.minutes(1),
    "4m": delta_time.minutes(4),
    "30m": delta_time.minutes(30),
    "2h": delta_time.hours(2),
    "12h": delta_time.hours(12),
    "1d": delta_time.days(1)
}

EXTENTS = list(EXTENT_TO_SECONDS.keys())
DEFAULT_EXTENT = EXTENTS[0]
SMAS = list(SMA_TO_SECONDS.keys())


def check_extent(extent):
    if extent is None or extent not in EXTENTS:
        return DEFAULT_EXTENT
    return extent


def check_sma(extent, sma):
    extent = check_extent(extent)
    if sma is None or sma not in SMAS:
        return EXTENT_TO_DEFAULT_SMA[extent]
    return sma


def get_as_dict():
    return {
        "extents": EXTENT_TO_SECONDS,
        "smas": SMA_TO_SECONDS,
        "default_extent": DEFAULT_EXTENT,
        "default_sma": EXTENT_TO_DEFAULT_SMA,
    }


def get_last_epoch(default=GENESIS):
    return get_last_aggr_post_time(default=default)


def get_last_aggr_post_time(default=GENESIS):
    last_crawled_post_update_time = db.session.query(AggregatePostCount.next_time) \
        .order_by(desc(AggregatePostCount.next_time)) \
        .limit(1) \
        .scalar()
    if last_crawled_post_update_time is None:
        return default
    return last_crawled_post_update_time


def get_last_aggr_stream_time(default=GENESIS):
    last_streamed_post_update_time = db.session.query(StreamedAggregatePostCount.next_time) \
        .order_by(desc(StreamedAggregatePostCount.next_time)) \
        .limit(1) \
        .scalar()
    if last_streamed_post_update_time is None:
        return default
    return last_streamed_post_update_time


def get_last_streamed_post_time(default=GENESIS):
    last_crawled_post_time = db.session.query(StreamedPost.time) \
        .order_by(desc(StreamedPost.time)) \
        .limit(1) \
        .scalar()
    if last_crawled_post_time is None:
        return default
    return last_crawled_post_time


def get_last_crawled_post_time(default=GENESIS):
    last_crawled_post_time = db.session.query(Post.time) \
        .order_by(desc(Post.time)) \
        .limit(1) \
        .scalar()
    if last_crawled_post_time is None:
        return default
    return last_crawled_post_time


def get_last_price_time(default=GENESIS):
    last_price_update_time = db.session.query(Price.time) \
        .order_by(desc(Price.time)) \
        .limit(1) \
        .scalar()
    if last_price_update_time is None:
        return default
    return last_price_update_time


TRIGGER_TIME_WINDOW_TO_SECONDS = {
    "5m": delta_time.minutes(5),
    "10m": delta_time.minutes(10),
    "30m": delta_time.minutes(20),
    "1h": delta_time.hours(1),
    "5h": delta_time.hours(5),
    "12h": delta_time.hours(12),
    "1d": delta_time.hours(12)
}

TRIGGER_TIME_WINDOWS = list(TRIGGER_TIME_WINDOW_TO_SECONDS.keys())

DEFAULT_TRIGGER_TIME_WINDOW = TRIGGER_TIME_WINDOWS[0]
