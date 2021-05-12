from sqlalchemy import desc

from data.database import db, Post, StreamedAggregatePostCount, Price

GENESIS = 1615386994

POST_COUNT_INTERVAL = 60
STREAMED_POST_COUNT_INTERVAL = 20
DEFAULT_EXTENT = "d"

EXTENT_TO_SECONDS = {
    "d": 60 * 60 * 24,
    "w": 60 * 60 * 24 * 7,
    "m": 60 * 60 * 24 * 30,
    "y": 60 * 60 * 24 * 365,
}

SMA_TO_SECONDS = {
    "4m": 60 * 5,
    "30m": 60 * 20,
    "2h": 60 * 60 * 2,
    "12h": 60 * 60 * 12,
    "1d": 60 * 60 * 24
}

EXTENTS = list(EXTENT_TO_SECONDS.keys())
SMAS = list(SMA_TO_SECONDS.keys())

EXTENT_TO_DEFAULT_SMA = {
    "d": "4m",
    "w": "30m",
    "m": "2h",
    "y": "1d"
}


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
    last_crawled_post = db.session.query(Post.time).order_by(desc(Post.time)).limit(1).first()
    if last_crawled_post is None:
        return default
    return last_crawled_post.time


def get_last_stream_update(default=GENESIS):
    last_streamed_post_update = db.session.query(StreamedAggregatePostCount.time) \
        .order_by(desc(StreamedAggregatePostCount.time)) \
        .first()
    if last_streamed_post_update is None:
        return default
    return last_streamed_post_update[0]


def get_last_price_update(default=GENESIS):
    last_price_update = db.session.query(Price.time) \
        .order_by(desc(Price.time)) \
        .first()
    if last_price_update is None:
        return default
    return last_price_update[0]
