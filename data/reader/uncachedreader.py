
from data.collector import Collector
from data.database import db
from misc import TimeRange, closed_distinct_intervals
from tqdm import tqdm


# Represents a "Haşin okuyucu" that collects from a collector and saves the result into the database.
# The old results that were saved into the database are replaced.
class UncachedReader(object):
    def __init__(self, collector: Collector, model, replace_old=True):
        self.collector = collector
        self.model = model
        self.replace_old = replace_old

    def read_uncached(self, time_range: TimeRange, save_interval=None, retry_on_error=True):
        collector_state = self.collector.state()
        pre_query = self.model.query\
            .filter(self.model.time <= time_range.high)\
            .filter(self.model.time >= time_range.low)\
            .filter(self.model.type == collector_state)
        # First, remove the old data.
        print("UncachedReader: Found", pre_query.count(), "many old rows.")
        if self.replace_old:
            print("UncachedReader: Removing the old rows...")
            pre_query.delete()
            db.session.commit()
        interval_generator = (time_range,)
        if save_interval is not None:
            interval_generator = closed_distinct_intervals(time_range, save_interval)
        # Then, collect the new data.
        for tr in interval_generator:
            print("UncachedReader: Initiating the collection within", tr)
            while True:
                try:
                    collected = list(tqdm(self.collector.collect(tr), "Collecting..."))
                    break
                except Exception as e:
                    print("UncachedReader: Encountered an error", e)
                    if not retry_on_error:
                        print("UncachedReader: Discarding...")
                        collected = []
                        break
                    print("UncachedReader: Retrying...")
            print("UncachedReader: Successfully collected", len(collected), "points. Saving into the database.")
            # Set the type of the model to the operation description/collector state.
            for c in collected:
                c.type = collector_state
            db.session.bulk_save_objects(collected)
            db.session.commit()
        # Now, read the data back from the database.
        inserted = db.session.query(self.model)\
            .filter(self.model.time <= time_range.high)\
            .filter(self.model.time >= time_range.low)\
            .filter(self.model.type == collector_state)\
            .all()
        return inserted
