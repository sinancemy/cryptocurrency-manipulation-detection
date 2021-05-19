import functools

from data.collector import Collector
from data.database import db, CachedRange
from misc import TimeRange, interval_to_time_range
import portion as P
from tqdm import tqdm


def cached_range_reader(range_type: str):
    cached_ranges = CachedRange.query.filter_by(type=range_type)
    return list(map(lambda cr: TimeRange(cr.low, cr.high), cached_ranges))


# Represents a reader that collects from a collector and caches the results along with the state of the collector into
# the database.
class CachedReader(object):
    def __init__(self, collector: Collector, model):
        self.collector = collector
        self.model = model

    def read_cached(self, time_range: TimeRange):
        collector_state = self.collector.state()
        db_ranges, collector_ranges = self.find_ranges(collector_state, time_range)
        if len(collector_ranges) > 0:
            print("CachedReader: Cache misses occurred for", collector_state, collector_ranges)
        # First, handle the ranges that should be read from the crawlers.
        for r in collector_ranges:
            collected = list(tqdm(self.collector.collect(r), "CachedReader: Collecting from "
                                  + self.collector.__class__.__name__))
            # Set the type of the model to the operation description/collector state.
            for c in collected:
                c.type = collector_state
            db.session.bulk_save_objects(collected)
            db.session.commit()
        # Save the cached range information into the database.
        if len(collector_ranges) > 0:
            print("CachedReader: Caching...")
            cached_ranges = [CachedRange(low=r.low, high=r.high, type=collector_state) for r in collector_ranges]
            db.session.bulk_save_objects(cached_ranges)
            db.session.commit()
        # Now, read the data back from the database.
        inserted = db.session.query(self.model)\
            .filter(self.model.time <= time_range.high)\
            .filter(self.model.time >= time_range.low)\
            .filter(self.model.type == collector_state)\
            .all()
        return inserted

    # Returns overlapping ranges, excluded ranges
    def find_ranges(self, range_type: str, requested_range: TimeRange) -> (list, list):
        cached_ranges = cached_range_reader(range_type)
        if len(cached_ranges) == 0:
            return [], [requested_range]
        requested_interval = P.closed(requested_range.low, requested_range.high)
        # Get the union of all the cached ranges as a nonatomic interval.
        cached_interval = functools.reduce(P.Interval.union, (P.closed(r.low, r.high) for r in cached_ranges))
        to_collect = requested_interval.difference(cached_interval)
        to_read = requested_interval.intersection(cached_interval)
        return list(filter(lambda x: x is not None, map(interval_to_time_range, to_read))), \
               list(filter(lambda x: x is not None, map(interval_to_time_range, to_collect)))
