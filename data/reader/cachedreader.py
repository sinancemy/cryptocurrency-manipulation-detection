import functools
import itertools

from data.crawler import Crawler
from data.database import Database, RangeSelector, MatchSelector
from data.database.models import CachedRange
from misc import TimeRange, CoinType, interval_to_time_range
import portion as P


def cached_range_reader(db: Database, range_type: str):
    return list(map(lambda cr: cr.range, db.read_cached_ranges_by_type(range_type)))


class CachedReader(object):
    def __init__(self, crawler: Crawler, db: Database, table: str, row_converter, db_inserter):
        self.db = db
        self.crawler = crawler
        self.table = table
        self.row_converter = row_converter
        self.db_inserter = db_inserter

    def read_cached(self, coin: CoinType, time_range: TimeRange):
        # Set the crawler's coin type.
        self.crawler.settings.coin = coin
        range_type = self.crawler.state()
        db_ranges, crawler_ranges = self.find_ranges(range_type, time_range)
        print("CachedReader: Cache hits for", range_type, db_ranges)
        print("CachedReader: Cache misses for", range_type, crawler_ranges)
        # First, handle the ranges that should be read from the crawlers.
        for r in crawler_ranges:
            collected = self.crawler.collect(r)
            self.db_inserter(collected)
        # Save the cached range information into the database.
        if len(crawler_ranges) > 0:
            print("CachedReader: Caching...")
            self.db.create_cached_ranges(map(lambda r: CachedRange(r.low, r.high, range_type), crawler_ranges))
        # Now, read the data from the database.
        return self.db.read_by(self.table, [RangeSelector("time", time_range.low, time_range.high),
                                            MatchSelector("coin_type", coin.value)], self.row_converter)

    # Returns overlapping ranges, excluded ranges
    def find_ranges(self, range_type: str, requested_range: TimeRange) -> (list, list):
        cached_ranges = cached_range_reader(self.db, range_type)
        if len(cached_ranges) == 0:
            return [], [requested_range]
        requested_interval = P.closed(requested_range.low, requested_range.high)
        # Get the union of all the cached ranges as a nonatomic interval.
        cached_interval = functools.reduce(P.Interval.union, (P.closed(r.low, r.high) for r in cached_ranges))
        to_crawl = requested_interval.difference(cached_interval)
        to_read = requested_interval.intersection(cached_interval)
        return list(filter(lambda x: x is not None, map(interval_to_time_range, to_read))), \
               list(filter(lambda x: x is not None, map(interval_to_time_range, to_crawl)))
