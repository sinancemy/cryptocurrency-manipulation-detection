import functools

from data.collector import Collector
from data.database import Database, RangeSelector, MatchSelector
from data.database.models import CachedRange
from misc import TimeRange, CoinType, interval_to_time_range
import portion as P


def cached_range_reader(db: Database, range_type: str):
    return list(map(lambda cr: cr.range, db.read_cached_ranges_by_type(range_type)))


class CachedReader(object):
    def __init__(self, collector: Collector, db: Database, table: str, row_converter):
        self.db = db
        self.collector = collector
        self.table = table
        self.row_converter = row_converter

    def read_cached(self, time_range: TimeRange):
        operation = self.collector.state()
        db_ranges, collector_ranges = self.find_ranges(operation, time_range)
        print("CachedReader: Cache hits for", operation, db_ranges)
        print("CachedReader: Cache misses for", operation, collector_ranges)
        # First, handle the ranges that should be read from the crawlers.
        for r in collector_ranges:
            collected = self.collector.collect(r)
            # Set the type of the model to the operation description.
            for c in collected:
                c.type = operation
            self.db.create(self.table, collected)
        # Save the cached range information into the database.
        if len(collector_ranges) > 0:
            print("CachedReader: Caching...")
            self.db.create("cached_ranges",
                           list(map(lambda r: CachedRange(r.low, r.high, operation), collector_ranges)), ignore=False)
        # Now, read the data from the database.
        return self.db.read_by(self.table, [RangeSelector("time", time_range.low, time_range.high),
                                            MatchSelector("type", operation)], self.row_converter)

    # Returns overlapping ranges, excluded ranges
    def find_ranges(self, range_type: str, requested_range: TimeRange) -> (list, list):
        cached_ranges = cached_range_reader(self.db, range_type)
        if len(cached_ranges) == 0:
            return [], [requested_range]
        requested_interval = P.closed(requested_range.low, requested_range.high)
        # Get the union of all the cached ranges as a nonatomic interval.
        cached_interval = functools.reduce(P.Interval.union, (P.closed(r.low, r.high) for r in cached_ranges))
        to_collect = requested_interval.difference(cached_interval)
        to_read = requested_interval.intersection(cached_interval)
        return list(filter(lambda x: x is not None, map(interval_to_time_range, to_read))), \
               list(filter(lambda x: x is not None, map(interval_to_time_range, to_collect)))
