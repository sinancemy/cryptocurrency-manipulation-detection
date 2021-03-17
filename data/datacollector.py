from data.database.database import Database
from data.misc.misc import CoinType, TimeRange
from itertools import accumulate


class DataCollector:
    def __init__(self, social_media_crawlers: list, price_crawlers: list):
        # Connect to the database
        self.db = Database()
        self.social_media_crawlers = social_media_crawlers
        self.price_crawlers = price_crawlers

    def collect_from_crawlers(self, coin: CoinType, time_range: TimeRange):
        return accumulate(map(lambda c: c.collect_posts(coin, time_range), self.social_media_crawlers),
                          lambda a, b: a + b)

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
        posts = []
        for db_range in db_ranges:
            posts += self.db.read_posts_by_time_and_coin_type(db_range.low, db_range.high, coin)
        for cr_range in crawler_ranges:
            posts += self.collect_from_crawlers(coin, cr_range)
            self.db.create_posts(posts)
        return sorted(posts, key=lambda p: p.time)

    def get_posts(self, coin: CoinType, time_range: TimeRange):
        pass

    def collect(self, coin: CoinType, time_range: TimeRange):
        pass


# Cached range test.
dc = DataCollector([], [])
cached_ranges = [
    TimeRange(0, 3),
    TimeRange(5, 8),
    TimeRange(10, 13),
]
res = dc.find_ranges(cached_ranges, TimeRange(-1, 15))
print(res)
