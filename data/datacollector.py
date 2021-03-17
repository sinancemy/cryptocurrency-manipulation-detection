from data.database.database import Database
from data.database.models import CachedRange
from data.market.yahoo import YahooPriceCrawler
from data.misc.misc import CoinType, TimeRange
from itertools import accumulate
import time


class DataCollector:
    def __init__(self, social_media_crawlers: list, price_crawlers: list):
        # Connect to the database
        self.db = Database()
        self.social_media_crawlers = social_media_crawlers
        self.price_crawlers = price_crawlers

    def collect_price_from_crawlers(self, coin: CoinType, time_range: TimeRange):
        return list(accumulate(map(lambda c: c.collect_prices(coin, time_range, "1m"), self.price_crawlers),
                          lambda a, b: a + b))[0]

    def find_ranges(self, cached_ranges: list, requested_range: TimeRange):
        overlapping_cached_ranges = []
        excluded_ranges = []
        for cached_range in cached_ranges:
            remaining_ranges = cached_range.subtract(requested_range)
            # If cached range encompasses the requested range, then simply use the cached range.
            if len(remaining_ranges) == 0:
                return [[cached_range], []]
            # If cached range is completely unrelated to the requested range, try the next one.
            if len(remaining_ranges) == 1 and remaining_ranges[0].equals(requested_range):
                continue
            # If the requested range was split by the cached range, first add the cached range, and then recurse on the
            # splits.
            overlapping_cached_ranges.append(cached_range)
            for split_range in remaining_ranges:
                res = self.find_ranges(cached_ranges, split_range)
                overlapping_cached_ranges += res[0]
                excluded_ranges += res[1]
            return [overlapping_cached_ranges, excluded_ranges]
        # If no encompassing cached range was found, nor was there any splits, simply return the requested
        # range.
        return [[], [requested_range]]

    def get_prices(self, coin: CoinType, time_range: TimeRange):
        cached_range_type = "price_" + coin.value
        cached_ranges = list(map(lambda cr: cr.range, self.db.read_cached_ranges_by_type(cached_range_type)))
        found_ranges = self.find_ranges(cached_ranges, time_range)
        db_ranges = found_ranges[0]
        crawler_ranges = found_ranges[1]
        prices = []
        for db_range in db_ranges:
            prices += self.db.read_prices_by_time_and_coin_type(db_range.low, db_range.high, coin)
        for cr_range in crawler_ranges:
            prices += self.collect_price_from_crawlers(coin, cr_range)
            self.db.create_prices(prices)
        if len(crawler_ranges) > 0:
            self.db.create_cached_ranges(map(lambda cr: CachedRange(cr.low, cr.high, cached_range_type), crawler_ranges))
        return sorted(prices, key=lambda p: p.time)

    def get_posts(self, coin: CoinType, time_range: TimeRange):
        pass

    def collect(self, coin: CoinType, time_range: TimeRange):
        pass


dc = DataCollector([], [YahooPriceCrawler()])
prices = dc.get_prices(CoinType.BTC, TimeRange(time.time()-100, time.time()))
print(prices)
# Cached range test.
# dc = DataCollector([], [])
# cached_ranges = [
#     TimeRange(0, 3),
#     TimeRange(5, 8),
#     TimeRange(10, 13),
# ]
# res = dc.find_ranges(cached_ranges, TimeRange(-1, 15))
# print(res)