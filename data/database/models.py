# Represent a generic social media post.
from data.misc.misc import CoinType


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
        self.time = time
        self.volume = volume
