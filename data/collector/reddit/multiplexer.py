import time

from data.collector import Collector
from data.collector.reddit.archived import ArchivedRedditCrawler
from data.collector.reddit.realtime import RealtimeRedditCrawler
from misc import TimeRange


# Uses either the realtime reddit crawler or the archived reddit crawler.
class RedditMultiplexedCrawler(Collector):
    def __init__(self, realtime_threshold: int, realtime: RealtimeRedditCrawler, archived: ArchivedRedditCrawler):
        super().__init__(realtime_threshold=realtime_threshold, realtime_settings=realtime.settings,
                         archived_settings=archived.settings)
        self.realtime = realtime
        self.archived = archived

    def collect(self, time_range: TimeRange) -> iter:
        divisor = time.time() - self.settings.realtime_threshold
        archived_range, realtime_range = time_range.split(divisor)
        print("RedditMultiplexedCrawler: Archived range is", archived_range, "and realtime range is", realtime_range)
        if archived_range is not None:
            print("RedditMultiplexedCrawler: Collecting from the archived crawler.")
            for p in self.archived.collect(archived_range):
                yield p
        if realtime_range is not None:
            print("RedditMultiplexedCrawler: Collecting from the realtime crawler.")
            for p in self.realtime.collect(realtime_range):
                yield p

    @staticmethod
    def get_all_sources() -> list:
        return list(set(ArchivedRedditCrawler.get_all_sources()).union(RealtimeRedditCrawler.get_all_sources()))

    def update_coin(self, coin):
        super().update_coin(coin)
        self.realtime.settings.coin = self.settings.coin
        self.archived.settings.coin = self.settings.coin
