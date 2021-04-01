from data.database import Database, row_to_post, RangeSelector, MatchSelector
from misc import TimeRange, CoinType


class DataPrinter(object):
    def __init__(self, db: Database):
        self.db = db

    def print_prices(self, tr: TimeRange = None, ct: CoinType = None):
        if ct is None and tr is None:
            prices = self.db.read_prices()
        elif ct is None:
            prices = self.db.read_prices_by_time(tr.low, tr.high)
        elif tr is None:
            prices = self.db.read_prices_by_coin_type(ct)
        else:
            prices = self.db.read_prices_by_time_and_coin_type(tr.low, tr.high, ct)
        for price in prices:
            print(price.data)

    def print_posts(self, tr: TimeRange = None, ct: CoinType = None, src: str = None,
                    interaction_range: (int, int) = None):
        selectors = []
        if tr is not None:
            selectors.append(RangeSelector("time", tr.low, tr.high))
        elif ct is not None:
            selectors.append(MatchSelector("coin_type", ct.value))
        elif src is not None:
            selectors.append(MatchSelector("source", src))
        elif interaction_range is not None:
            selectors.append(RangeSelector("interaction", interaction_range[0], interaction_range[1]))
        posts = self.db.read_by("posts", selectors, row_to_post)
        for post in posts:
            print(post.data)
