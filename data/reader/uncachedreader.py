from sqlalchemy import func

from backend import api_settings
from data.collector import Collector
from data.database import db
from misc import TimeRange, closed_distinct_intervals
from tqdm import tqdm


# Represents a "Haşin okuyucu" that collects from a collector and saves the result into the database.
# The old results that were saved into the database are replaced.
class UncachedReader(object):
    def __init__(self, collector: Collector, model, replace_old=True, dynamic_low=True, retry_on_error=True,
                 save_interval=None):
        self.collector = collector
        self.model = model
        self.replace_old = replace_old
        self.dynamic_low = dynamic_low
        self.retry_on_error = retry_on_error
        self.save_interval = save_interval

    def read_uncached(self, time_range: TimeRange):
        collector_state = self.collector.state()
        if self.dynamic_low:
            last_collected = db.session.query(func.max(self.model.time))\
                .filter(self.model.type == collector_state)\
                .scalar()
            if last_collected is None or last_collected < time_range.low:
                if last_collected is not None and last_collected < time_range.low:
                    new_low = last_collected
                if last_collected is None:
                    new_low = api_settings.GENESIS
                print("UncachedReader: Adjusting the time range start from", time_range.low, "to", new_low,
                      "for", collector_state)
                time_range.low = new_low
        pre_query = self.model.query\
            .filter(self.model.time <= time_range.high)\
            .filter(self.model.time > time_range.low)\
            .filter(self.model.type == collector_state)
        # First, remove the old data.
        print("UncachedReader: Found", pre_query.count(), "many old rows.")
        if self.replace_old:
            print("UncachedReader: Removing the old rows...")
            pre_query.delete()
            db.session.commit()
        interval_generator = (time_range,)
        if self.save_interval is not None:
            interval_generator = closed_distinct_intervals(time_range, self.save_interval)
        # Then, collect the new data.
        for tr in interval_generator:
            print("UncachedReader: Initiating the collection within", tr)
            while True:
                try:
                    collected = list(tqdm(self.collector.collect(tr), "Collecting..."))
                    break
                except Exception as e:
                    print("UncachedReader: Encountered an error", e)
                    if not self.retry_on_error:
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
