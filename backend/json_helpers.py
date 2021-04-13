from data.database.models import Post, MarketPrice


# To be modified.
def post_to_dict(post: Post):
    return post.__dict__


# To be modified.
def price_to_dict(price: MarketPrice):
    return price.__dict__
