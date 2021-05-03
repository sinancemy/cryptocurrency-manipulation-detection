from data.collector import Collector
from data.collector.sources import get_all_sources
from data.database import Database, PostVolume, MatchSelector
from misc import TimeRange, CoinType


class PostVolumeCalculator(Collector):

    def __init__(self, interval: int, coin: CoinType = CoinType.BTC):
        super().__init__(interval=interval, coin=coin)

    def collect_with_selectors(self, db: Database, time_range: TimeRange, source, post_selectors):
        print("PostVolumeCalculator: Calculating within", time_range, "for", source)
        volume_so_far = db.read_num_posts_within_time(0, time_range.low - 1, post_selectors)
        for t in range(time_range.low, time_range.high + 1, self.settings.interval + 1):
            tr = TimeRange(t, min(t + self.settings.interval, time_range.high))
            count = db.read_num_posts_within_time(tr.low, tr.high, post_selectors)
            volume_so_far += count
            yield PostVolume(tr.low, tr.high, volume_so_far, count, source)

    def collect(self, time_range: TimeRange) -> iter:
        db = Database()
        # First, calculate for the coin.
        source = "coin:" + self.settings.coin
        selectors = [MatchSelector("coin_type", self.settings.coin)]
        for p in self.collect_with_selectors(db, time_range, source, selectors):
            yield p
        # Then, calculate per source.
        all_sources = get_all_sources(db)
        for source in all_sources:
            # Do not calculate post volume per user!
            if not source.startswith("*@"):
                continue
            source_str = "source:" + source
            selectors += [MatchSelector("source", source)]
            for p in self.collect_with_selectors(db, time_range, source_str, selectors):
                yield p

    @staticmethod
    def get_all_sources() -> list:
        return []
