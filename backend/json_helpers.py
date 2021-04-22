from data.database.models import Post, MarketPrice


# To be modified.
def post_to_dict(post: Post):
    return post.__dict__


# To be modified.
def price_to_dict(price: MarketPrice):
    return price.__dict__


def dictify(o):
    if isinstance(o, list):
        return [dictify(e) for e in o]
    if hasattr(o, "__dict__"):
        d = o.__dict__
        for k in d:
            d[k] = dictify(d[k])
        return d
    return o
