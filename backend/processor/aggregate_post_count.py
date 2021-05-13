import json
from dataclasses import dataclass

import pandas as pd
from tqdm import tqdm

from backend import api_settings
from data.database import Post, db, StreamedPost
from data.database.aggregate_models import AggregatePostCount, StreamedAggregatePostCount
from misc import TimeRange, CoinType


@dataclass
class PostVolumeResult:
    time: int
    next_time: int
    smas: str
    sum: int
    source: str


class PostVolumeCalculator:

    def __init__(self, model_time_field, interval: int, calculate_smas: bool):
        self.calculate_smas = calculate_smas
        self.interval = interval
        self.model_time_field = model_time_field

    def calculate(self, time_range: TimeRange, source, pre_query):
        tqdm.pandas()
        max_sma = int(max(api_settings.SMA_TO_SECONDS.values()) / self.interval)
        df = pd.DataFrame(dtype=int)
        # Shift the lower end back for SMA calculation.
        l = time_range.low - self.interval * max_sma if self.calculate_smas else time_range.low
        h = time_range.high
        df['time_start'] = pd.Series(range(l, h, self.interval)).astype(int)
        df['time_end'] = df['time_start'].shift(periods=-1)
        # Nothing to calculate.
        if df.shape[0] < 2:
            return
        # Discard the last row
        df = df.iloc[:-1]
        # Fetch all the posts within the time range into the memory.
        posts = pre_query \
            .filter(self.model_time_field >= l) \
            .filter(self.model_time_field <= h) \
            .order_by(self.model_time_field) \
            .all()
        dt = pd.Series(list(map(lambda r: r[0], posts)))
        # Get the counts.
        df['count'] = df.progress_apply(lambda r: dt.between(int(r[0]), int(r[1])).sum(axis=0), axis=1)
        # Calculate SMAs.
        if self.calculate_smas:
            sdf = pd.DataFrame()
            for sma_key, sma_amount in api_settings.SMA_TO_SECONDS.items():
                window = int(sma_amount / self.interval)
                sdf[sma_key] = df['count'].rolling(window).mean()
            for i, r in df[max_sma - 1:].iterrows():
                smas = {sdf_row[0]: sdf_row[1] for sdf_row in sdf.iloc[i].to_dict().items()}
                yield PostVolumeResult(time=int(r['time_start']), next_time=int(r['time_end']),
                                       smas=json.dumps(smas), sum=r['count'], source=source)
        else:
            for i, r in df.iterrows():
                yield PostVolumeResult(time=int(r['time_start']), next_time=int(r['time_end']),
                                       smas=json.dumps({}), sum=r['count'], source=source)

    def calculate_for_coin(self, time_range: TimeRange, coin: CoinType, pre_query) -> iter:
        source = "coin:" + coin.value
        pre_query = pre_query.filter_by(coin_type=coin)
        for p in self.calculate(time_range, source, pre_query):
            yield p

    def calculate_for_source(self, time_range: TimeRange, source: str, pre_query) -> iter:
        postvolume_source = "source:" + source
        source_parts = source.split("@")
        pre_query = pre_query.filter_by(source=source_parts[1])
        for p in self.calculate(time_range, postvolume_source, pre_query):
            yield p


def create_with(interval, coins, sources, closed_time_range: TimeRange, pre_query, model_time_field, converter,
                calculate_smas=True):
    calculator = PostVolumeCalculator(interval=interval, calculate_smas=calculate_smas,
                                      model_time_field=model_time_field)
    for coin in coins:
        print("Calculating aggregate post counts for", coin.value)
        result = list(
            map(converter, calculator.calculate_for_coin(closed_time_range, coin, pre_query)))
        print("Saving into database...")
        db.session.bulk_save_objects(result)
        db.session.commit()
    for source in sources:
        print("Calculating aggregate post counts for", source)
        result = list(
            map(converter, calculator.calculate_for_source(closed_time_range, source, pre_query)))
        print("Saving into database...")
        db.session.bulk_save_objects(result)
        db.session.commit()


# TimeRange is closed.
def create_aggregate_post_counts(coins: list, sources: list, closed_time_range: TimeRange):
    # First delete the previously calculated values, if they exist.
    db.session.query(AggregatePostCount) \
        .filter(AggregatePostCount.time >= closed_time_range.low) \
        .filter(AggregatePostCount.next_time <= closed_time_range.high) \
        .delete()
    pre_query = db.session.query(Post.time)
    model_time_field = Post.__table__.c["time"]
    converter = lambda res: AggregatePostCount(time=res.time, next_time=res.next_time, smas=res.smas, sum=res.sum,
                                               source=res.source)
    create_with(api_settings.POST_COUNT_INTERVAL, coins, sources, closed_time_range, pre_query, model_time_field, converter)


def create_streamed_aggregate_post_counts(coins: list, sources: list, closed_time_range: TimeRange):
    # First delete the previously calculated values, if they exist.
    db.session.query(StreamedAggregatePostCount) \
        .filter(StreamedAggregatePostCount.time >= closed_time_range.low) \
        .filter(StreamedAggregatePostCount.next_time <= closed_time_range.high) \
        .delete()
    pre_query = db.session.query(StreamedPost.time)
    model_time_field = StreamedPost.__table__.c["time"]
    converter = lambda res: StreamedAggregatePostCount(time=res.time, next_time=res.next_time, sum=res.sum,
                                                       source=res.source)
    create_with(api_settings.STREAMED_POST_COUNT_INTERVAL, coins, sources, closed_time_range, pre_query, model_time_field, converter, False)
