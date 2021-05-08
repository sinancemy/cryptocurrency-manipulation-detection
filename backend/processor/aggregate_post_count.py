from tqdm import tqdm

from data.database import AggregatePostCount, Post, db
from misc import TimeRange, CoinType, closed_distinct_intervals


class PostVolumeCalculator:

    def __init__(self, interval: int):
        self.interval = interval

    def calculate(self, time_range: TimeRange, source, pre_query):
        count_so_far = pre_query.filter(Post.time < time_range.low).count()
        for tr in closed_distinct_intervals(time_range, self.interval):
            count = pre_query.filter(Post.time < tr.high).filter(Post.time >= tr.low).count()
            count_so_far += count
            yield AggregatePostCount(time=tr.low, next_time=tr.high, cum=count_so_far, sum=count, source=source)

    def calculate_for_coin(self, coin: CoinType, time_range: TimeRange) -> iter:
        source = "coin:" + coin.value
        pre_query = Post.query\
            .distinct(Post.unique_id)\
            .group_by(Post.unique_id) \
            .filter_by(coin_type=coin)
        for p in self.calculate(time_range, source, pre_query):
            yield p

    def calculate_for_source(self, source: str, time_range: TimeRange) -> iter:
        postvolume_source = "source:" + source
        source_parts = source.split("@")
        pre_query = Post.query\
            .distinct(Post.unique_id)\
            .group_by(Post.unique_id) \
            .filter_by(source=source_parts[1])
        for p in self.calculate(time_range, postvolume_source, pre_query):
            yield p


# TimeRange is closed.
def create_aggregate_post_counts(coins, sources, closed_time_range: TimeRange):
    # First delete the previously calculated values, if they exist.
    db.session.query(AggregatePostCount)\
        .filter(AggregatePostCount.time >= closed_time_range.low)\
        .filter(AggregatePostCount.next_time <= closed_time_range.high)\
        .delete()
    calculator = PostVolumeCalculator(interval=60 * 30)
    post_volumes = []
    for coin in coins:
        post_volumes += list(tqdm(calculator.calculate_for_coin(coin, closed_time_range),
                                  "Calculating aggregate post counts for " + coin.value))
    for source in sources:
        post_volumes += list(tqdm(calculator.calculate_for_source(source, closed_time_range),
                                  "Calculating aggregate post counts for " + source))
    db.session.bulk_save_objects(post_volumes)
    db.session.commit()
