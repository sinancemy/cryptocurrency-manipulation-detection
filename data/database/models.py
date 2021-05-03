from misc import CoinType, TimeRange


# Converts a row from 'posts' table into a Post.
def row_to_post(r):
    return Post(CoinType(r[1]), r[2], r[3], r[4], r[5], r[6], r[7], r[8])


# Converts a row from 'prices' table into a MarketPrice
def row_to_price(r):
    return MarketPrice(CoinType(r[1]), r[2], r[3], r[4], r[5])


# Converts a row from 'cached_ranges' table into a CachedRange
def row_to_cached_range(r):
    return CachedRange(r[1], r[2], r[3])


def row_to_user(r):
    return User(r[0], r[1], r[2], r[3])


def row_to_followed_coin(r):
    return FollowedCoin(r[0], r[1], CoinType(r[2]), r[3], r[4], r[5])


def row_to_followed_source(r):
    return FollowedSource(r[0], r[1], r[2], r[3], r[4], r[5])


def row_to_session(r):
    return Session(r[1], r[2], r[3])


class Post(object):
    def __init__(self, coin_type: CoinType, user: str, content: str, source: str, interaction: int, time: int,
                 unique_id: str, type: str = "null", impact=None):
        self.user = user
        self.content = content
        self.interaction = interaction
        self.source = source
        self.time = time
        self.unique_id = unique_id
        self.coin_type = coin_type
        self.type = type
        self.impact = impact

    def copy(self):
        return Post(self.coin_type, self.user, self.content, self.source, self.interaction, self.time, self.unique_id,
                    self.type, self.impact)


# Represents a market price of a particular coin for a particular time.
class MarketPrice(object):
    def __init__(self, coin_type: CoinType, price: float, time: int, volume: float,
                 type: str = "null"):
        self.coin_type = coin_type
        self.price = price
        self.time = time
        self.volume = volume
        self.type = type


class CachedRange(object):
    def __init__(self, low: int, high: int, type: str):
        self.low = low
        self.high = high
        self.type = type


class User(object):
    def __init__(self, id: int, username: str, password: str, salt: str):
        self.id = id
        self.username = username
        self.password = password
        self.salt = salt


class FollowedCoin(object):
    def __init__(self, id: int, userid: int, coin_type: CoinType, notify_email: int,
                 notification_read: int, notification_time: int):
        self.id = id
        self.userid = userid
        self.coin_type = coin_type
        self.notify_email = notify_email
        self.notification_read = notification_read
        self.notification_time = notification_time


class FollowedSource(object):
    def __init__(self, id: int, userid: int, source: str, notify_email: int,
                 notification_read: int, notification_time: int):
        self.id = id
        self.userid = userid
        self.source = source
        self.notify_email = notify_email
        self.notification_read = notification_read
        self.notification_time = notification_time

    def __repr__(self):
        return self.source


class Session(object):
    def __init__(self, userid: int, token: str, expiration: int):
        self.userid = userid
        self.token = token
        self.expiration = expiration
