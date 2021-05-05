from enum import Enum

from data.database.data_models import Post, MarketPrice


# To be modified.
def post_to_dict(post: Post):
    return post.__dict__


# To be modified.
def price_to_dict(price: MarketPrice):
    return price.__dict__


def dictify(o, excluded_keys: set):
    if isinstance(o, list):
        return [dictify(e, excluded_keys) for e in o]
    if isinstance(o, Enum):
        return o.value
    if hasattr(o, "__dict__"):
        d: dict = o.__dict__
        for e in excluded_keys:
            if e in d:
                d.pop(e)
        for k in d:
            d[k] = dictify(d[k], excluded_keys)
        return d
    return o
