from sqlalchemy import Integer, Column

from misc import CoinType, TimeRange

from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


# Converts a row from 'posts' table into a Post.
def row_to_post(r):
    return Post(CoinType(r[1]), r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9])


# Converts a row from 'prices' table into a MarketPrice
def row_to_price(r):
    return MarketPrice(CoinType(r[1]), r[2], r[3], r[4], r[5])


def row_to_post_volume(r):
    return PostVolume(r[1], r[2], r[3], r[4], r[5])


# Converts a row from 'cached_ranges' table into a CachedRange
def row_to_cached_range(r):
    return CachedRange(r[1], r[2], r[3])


def row_to_user(r):
    return User(r[0], r[1], r[2], r[3])


def row_to_follower(r):
    return Follower(r[0], r[1], r[2], r[3], r[4])


def row_to_trigger(r):
    return Trigger(r[0], r[1], r[2], r[3], r[4])


def row_to_notification(r):
    return Notification(r[0], r[1], r[2], r[3])


def row_to_session(r):
    return Session(r[1], r[2], r[3])


class Post(object):
    def __init__(self, coin_type: CoinType, user: str, content: str, source: str, interaction: int, time: int,
                 unique_id: str, type: str = "null", impact=0.):
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


class PostVolume(object):
    def __init__(self, time: int, next_time: int, volume: int, count: int, source: str):
        self.time = time
        self.next_time = next_time
        self.volume = volume
        self.count = count
        self.source = source


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


class Follower(object):
    def __init__(self, id: int, userid: int, type: str, target: str, notify_email: int):
        self.id = id
        self.userid = userid
        self.type = type
        self.target = target
        self.notify_email = notify_email


class Trigger(object):
    def __init__(self, id: int, followerid: int, type: str, threshold: int, time_window: str):
        self.id = id
        self.followerid = followerid
        self.type = type
        self.time_window = time_window
        self.threshold = threshold


class Notification(object):
    def __init__(self, id: int, triggerid: int, time: int, read: int):
        self.id = id
        self.triggerid = triggerid
        self.time = time
        self.read = read


class Session(object):
    def __init__(self, userid: int, token: str, expiration: int):
        self.userid = userid
        self.token = token
        self.expiration = expiration
