from data.crawler import Crawler
from data.database import Database, RangeSelector
from data.database.models import CachedRange
from misc import TimeRange


def cached_range_reader(db: Database, range_type: str):
    return map(lambda cr: cr.range, db.read_cached_ranges_by_type(range_type))


class CachedReader(object):
    def __init__(self, crawler: Crawler, db: Database, table: str, row_converter, db_inserter):
        self.db = db
        self.crawler = crawler
        self.table = table
        self.row_converter = row_converter
        self.db_inserter = db_inserter

    def read_cached(self, time_range: TimeRange):
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
            self.db.create_cached_ranges(map(lambda r: CachedRange(r.low, r.high, range_type), crawler_ranges))
        # Now, read the data from the database.
        return self.db.read_by(self.table, [RangeSelector("time", time_range.low, time_range.high)], self.row_converter)

    # Returns overlapping ranges, excluded ranges
    def find_ranges(self, range_type: str, requested_range: TimeRange) -> tuple:
        cached_ranges = [*cached_range_reader(self.db, range_type)]
        return self.__find_ranges_aux(cached_ranges, requested_range)

    def __find_ranges_aux(self, cached_ranges: list, requested_range: TimeRange) -> tuple:
        overlapping_cached_ranges = []
        excluded_ranges = []
        for cached_range in cached_ranges:
            remaining_ranges = self.__split_ranges(cached_range, requested_range)
            # If cached range encompasses the requested range, then simply use the cached range.
            if len(remaining_ranges) == 0:
                return [cached_range], []
            # If cached range is completely unrelated to the requested range, try the next one.
            if len(remaining_ranges) == 1 and remaining_ranges[0].equals(requested_range):
                continue
            # If the requested range was split by the cached range, first add the cached range, and then recurse
            # on the splits.
            overlapping_cached_ranges.append(cached_range)
            for split_range in remaining_ranges:
                res = self.__find_ranges_aux(cached_ranges, split_range)
                overlapping_cached_ranges += res[0]
                excluded_ranges += res[1]
            return overlapping_cached_ranges, excluded_ranges
        # If no encompassing cached range was found, nor were there any splits, simply return the requested
        # range.
        return [], [requested_range]

    # Returns the outstanding ranges after the given requested range is compared with the cached range.
    def __split_ranges(self, cached, requested):
        if requested.high <= cached.low or cached.high <= requested.low:
            return [requested]
        if cached.low <= requested.low and requested.high <= cached.high:
            return []
        if requested.low < cached.low and requested.high <= cached.high:
            return [TimeRange(requested.low, cached.low)]
        if cached.low <= requested.low and requested.high > cached.high:
            return [TimeRange(cached.high, requested.high)]
        # Split into two.
        if cached.low > requested.low and cached.high < requested.high:
            return [TimeRange(requested.low, cached.low), TimeRange(cached.high, requested.high)]
