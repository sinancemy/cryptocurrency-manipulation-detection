from datetime import datetime
from enum import Enum


class CoinType(str, Enum):
    BTC = "btc"
    ETH = "eth"
    DOGE = "doge"


def time_to_str(timestamp):
    return datetime.utcfromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')


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





