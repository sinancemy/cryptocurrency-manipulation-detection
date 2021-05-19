from sqlalchemy import func
from tqdm import tqdm

from data.database import Post, db
from data.database.aggregate_models import AggregatePostImpact
from misc import TimeRange, CoinType, closed_distinct_intervals


class AggregateImpactCalculator:

    def __init__(self, interval: int):
        self.interval = interval

    def calculate(self, time_range: TimeRange, source, pre_query):
        avg_impact_so_far = pre_query.filter(Post.time < time_range.low).first()[1]
        if avg_impact_so_far is None:
            avg_impact_so_far = 0.0
        for tr in closed_distinct_intervals(time_range, self.interval):
            avg = pre_query.filter(Post.time < tr.high).filter(Post.time >= tr.low).first()[0]
            if avg is None:
                avg = 0.0
            avg_impact_so_far += avg
            yield AggregatePostImpact(time=tr.low, next_time=tr.high, cum=avg_impact_so_far, avg=avg, source=source)

    def calculate_for_coin(self, coin: CoinType, time_range: TimeRange) -> iter:
        source = "coin:" + coin.value
        pre_query = db.session.query(func.avg(Post.avg_impact), func.sum(Post.avg_impact))\
            .distinct(Post.unique_id) \
            .group_by(Post.unique_id) \
        .filter_by(coin_type=coin)
        for p in self.calculate(time_range, source, pre_query):
            yield p

    def calculate_for_source(self, source: str, time_range: TimeRange) -> iter:
        aggregate_impact_source = "source:" + source
        source_parts = source.split("@")
        pre_query = db.session.query(func.avg(Post.avg_impact), func.sum(Post.avg_impact))\
            .distinct(Post.unique_id) \
            .group_by(Post.unique_id) \
            .filter_by(source=source_parts[1])
        for p in self.calculate(time_range, aggregate_impact_source, pre_query):
            yield p


# TimeRange is closed!
def create_aggregate_post_impacts(coins, sources, closed_time_range: TimeRange):
    # First delete the previously calculated values, if they exist.
    db.session.query(AggregatePostImpact)\
        .filter(AggregatePostImpact.time >= closed_time_range.low)\
        .filter(AggregatePostImpact.next_time <= closed_time_range.high)\
        .delete()
    calculator = AggregateImpactCalculator(interval=60 * 30)
    aggregate_impacts = []
    for coin in coins:
        aggregate_impacts += list(tqdm(calculator.calculate_for_coin(coin, closed_time_range),
                                       "Calculating aggregate impacts for " + coin.value))
    for source in sources:
        aggregate_impacts += list(tqdm(calculator.calculate_for_source(source, closed_time_range),
                                       "Calculating aggregate impacts for " + source))
    db.session.bulk_save_objects(aggregate_impacts)
    db.session.commit()
