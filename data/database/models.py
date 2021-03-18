# Represent a generic social media post.
from data.misc.misc import CoinType, TimeRange


# Converts a row from 'posts' table into a Post.
def row_to_post(r):
    return Post(CoinType(r[1]), r[2], r[3], r[4], r[5], r[6], r[7])


# Converts a row from 'prices' table into a MarketPrice
def row_to_price(r):
    return MarketPrice(CoinType(r[1]), r[2], r[3], r[4])


# Converts a row from 'cached_ranges' table into a CachedRange
def row_to_cached_range(r):
    return CachedRange(r[1], r[2], r[3])


class Post(object):
    def __init__(self, coin_type: CoinType, user: str, content: str, source: str, interaction: int, time: int,
                 unique_id: str):
        self.user = user
        self.content = content
        self.interaction = interaction
        self.source = source
        self.time = time
        self.unique_id = unique_id
        self.coin_type = coin_type


# Represents a market price of a particular coin for a particular time.
class MarketPrice(object):
    def __init__(self, coin_type: CoinType, price: float, time: int, volume: float):
        self.coin_type = coin_type
        self.price = price
        self.volume = volume
        self.time = time
        self.volume = volume


class CachedRange(object):
    def __init__(self, low: int, high: int, range_type: str):
        self.range = TimeRange(low, high)
        self.range_type = range_type
