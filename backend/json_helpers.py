from data.database.models import Post, MarketPrice


# To be modified.
def post_to_json(post: Post):
    return post.__dict__


# To be modified.
def price_to_json(price: MarketPrice):
    return price.__dict__
