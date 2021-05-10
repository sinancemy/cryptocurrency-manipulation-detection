import json
from dataclasses import dataclass
from datetime import datetime

import pandas as pd
from tqdm import tqdm

from data.database import AggregatePostCount, Post, db, StreamedAggregatePostCount, StreamedPost
from misc import TimeRange, CoinType


@dataclass
class PostVolumeResult:
    time: int
    next_time: int
    smas: str
    sum: int
    source: str


# In minutes.
SMA_MAP = {
    "d": 4,  # one minutes
    "w": 20,  # five minutes
    "m": 60 * 2,  # half hours
    "y": 60 * 24  # six hours
}


class PostVolumeCalculator:

    def __init__(self, interval: int):
        self.interval = interval

    def count_posts(self, low: datetime, high: datetime, pre_query, model_time_column):
        return pre_query \
            .filter(model_time_column < high.timestamp()) \
            .filter(model_time_column >= low.timestamp()) \
            .count()

    def calculate(self, time_range: TimeRange, source, pre_query, model_time_column):
        tqdm.pandas()
        max_sma = max(SMA_MAP.values())
        df = pd.DataFrame()
        # Shift the lower end back for SMA calculation.
        l = datetime.utcfromtimestamp(time_range.low) - pd.DateOffset(minutes=max_sma)
        h = datetime.utcfromtimestamp(time_range.high)
        df['time_start'] = pd.date_range(start=l, end=h, freq=pd.DateOffset(minutes=1))
        df['time_end'] = df['time_start'].shift(periods=-1)
        # Discard the last row
        df = df.iloc[:-1]
        # Fetch all the posts within the time range into the memory.
        posts = pre_query \
            .filter(model_time_column >= int(l.timestamp())) \
            .filter(model_time_column <= int(h.timestamp())) \
            .order_by(model_time_column) \
            .all()
        dt = pd.to_datetime(list(map(lambda r: r[0], posts)), unit='s')
        dt = dt.to_series()
        # Get the counts.
        df['count'] = df.progress_apply(lambda r: dt.between(r[0], r[1]).sum(axis=0), axis=1)
        # Calculate SMAs.
        sdf = pd.DataFrame()
        for sma_key, sma_amount in SMA_MAP.items():
            sdf[sma_key] = df['count'].rolling(sma_amount).mean()
        for i, r in df[max_sma - 1:].iterrows():
            smas = {sdf_row[0]: sdf_row[1] for sdf_row in sdf.iloc[i].to_dict().items()}
            yield PostVolumeResult(time=r['time_start'].timestamp(), next_time=r['time_end'].timestamp(),
                                   smas=json.dumps(smas), sum=r['count'], source=source)

    def calculate_for_coin(self, time_range: TimeRange, coin: CoinType, pre_query, model_time_column) -> iter:
        source = "coin:" + coin.value
        pre_query = pre_query.filter_by(coin_type=coin)
        for p in self.calculate(time_range, source, pre_query, model_time_column):
            yield p

    def calculate_for_source(self, time_range: TimeRange, source: str, pre_query, model_time_column) -> iter:
        postvolume_source = "source:" + source
        source_parts = source.split("@")
        pre_query = pre_query.filter_by(source=source_parts[1])
        for p in self.calculate(time_range, postvolume_source, pre_query, model_time_column):
            yield p


def _create(interval, coins, sources, closed_time_range: TimeRange, pre_query, model_time_field, converter):
    calculator = PostVolumeCalculator(interval=interval)
    for coin in coins:
        print("Calculating aggregate post counts for", coin.value)
        result = list(
            map(converter, calculator.calculate_for_coin(closed_time_range, coin, pre_query, model_time_field)))
        print("Saving into database...")
        db.session.bulk_save_objects(result)
        db.session.commit()
    for source in sources:
        print("Calculating aggregate post counts for", source)
        result = list(
            map(converter, calculator.calculate_for_source(closed_time_range, source, pre_query, model_time_field)))
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
    _create(60, coins, sources, closed_time_range, pre_query, model_time_field, converter)


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
    _create(60, coins, sources, closed_time_range, pre_query, model_time_field, converter)
