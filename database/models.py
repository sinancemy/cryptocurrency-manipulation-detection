# Represent a generic social media post.
class Post(object):
    def __init__(self, unique_id, poster, content, interaction, source, time):
        self.poster = poster
        self.content = content
        self.interaction = interaction
        self.source = source
        self.time = time
        self.unique_id = unique_id

    def __repr__(self):
        return "Post[poster=" + self.poster + ",content=" + self.content[0:20] + "...]"


# Represents a market price of a particular coin for a particular time.
class MarketPrice(object):
    def __init__(self, coin_name, price, time):
        self.coin_name = coin_name
        self.price = price
        self.time = time
