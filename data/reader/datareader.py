import itertools

from data.collector import Collector
from data.database import Post, Price
from data.reader.cachedreader import CachedReader
from misc import CoinType, TimeRange
from functools import reduce


# Either reads from the database or collects from the crawlers.
class DataReader(object):
    def __init__(self, social_media_crawlers: list, price_crawler: Collector):
        # Converts the crawlers into cached readers.
        self.cached_post_readers = [CachedReader(c, Post) for c in social_media_crawlers]
        self.cached_price_reader = CachedReader(price_crawler, Price)

    # Helper function. Updates the coin type of all the collectors. Can be used to utilize the same collectors for
    # different coins.
    def update_coin_type(self, coin: CoinType):
        for cr in itertools.chain([self.cached_price_reader], self.cached_post_readers):
            cr.collector.settings.coin = coin

    def read(self, time_range: TimeRange, price_window: int) -> (list, list):
        print("DataReader: Invoked to run within", time_range)
        # Collect all the posts within the time range.
        posts = sorted(reduce(list.__add__, map(lambda c: c.read_cached(time_range), self.cached_post_readers), []),
                       key=lambda x: x.time)
        # Collect all the possible prices according to the window.
        min_price_time = time_range.low - price_window
        max_price_time = time_range.high + price_window
        prices = self.cached_price_reader.read_cached(TimeRange(min_price_time, max_price_time))
        # Sort and return.
        return posts, sorted(prices, key=lambda x: x.time)
