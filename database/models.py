# Represent a generic social media post.
class Post(object):
    def __init__(self, poster, content, interaction, source, time):
        self.poster = poster
        self.content = content
        self.interaction = interaction
        self.source = source
        self.time = time


# Represents a market price of a particular coin for a particular time.
class MarketPrice(object):
    def __init__(self, coin_name, price, time):
        self.coin_name = coin_name
        self.price = price
        self.time = time
