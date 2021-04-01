from datetime import datetime
from enum import Enum
import os

import portion as P


class CoinType(str, Enum):
    BTC = "btc"
    ETH = "eth"
    DOGE = "doge"
    ADA = "ada"
    LINK = "link"
    DOT = "dot1"
    XRP = "xrp"
    LTC = "ltc"
    XLM = "xlm"
    OMG = "omg"


class TimeRange(object):
    def __init__(self, low, high):
        self.low = int(low)
        self.high = int(high)

    def in_range(self, timestamp):
        return self.low <= timestamp <= self.high

    def is_lower(self, timestamp):
        return timestamp < self.low

    def is_higher(self, timestamp):
        return timestamp > self.high

    def equals(self, other):
        return other.low == self.low and self.high == other.high

    def __repr__(self):
        return "[" + time_to_str(self.low) + ", " + time_to_str(self.high) + "]"


def time_to_str(timestamp):
    return datetime.utcfromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')


def interval_to_time_range(p: P.Interval):
    if p.empty:
        return None
    # low = p.lower + 1 if p.left == P.OPEN else p.lower
    # high = p.upper - 1 if p.right == P.OPEN else p.upper
    return TimeRange(p.lower, p.upper)


def chdir_to_main():
    while not {".gitignore"} <= set(os.listdir()):
        os.chdir("../")
