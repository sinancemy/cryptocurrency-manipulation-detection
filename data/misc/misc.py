from datetime import datetime
from enum import Enum


class CoinType(str, Enum):
    BTC = "btc"
    ETH = "eth"
    DOGE = "doge"


def time_to_str(timestamp):
    return datetime.utcfromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')


class TimeRange(object):
    def __init__(self, low=-1, high=-1):
        self.low = int(low)
        self.high = int(high)

    def in_range(self, timestamp):
        low_check = self.low == -1 or timestamp >= self.low
        high_check = self.high == -1 or timestamp <= self.high
        return low_check and high_check

    def is_lower(self, timestamp):
        return self.low > -1 and timestamp < self.low

    def is_higher(self, timestamp):
        return self.high > -1 and timestamp > self.high

    def __repr__(self):
        return "[" + time_to_str(self.low) + ", " + time_to_str(self.high) + "]"
