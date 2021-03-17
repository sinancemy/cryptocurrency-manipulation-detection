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
        self.low = low
        self.high = high

    def in_range(self, timestamp):
        return self.low <= timestamp <= self.high

    def is_lower(self, timestamp):
        return timestamp < self.low

    def is_higher(self, timestamp):
        return timestamp > self.high

    def equals(self, other):
        return other.low == self.low and self.high == other.high

    # Returns the remaining
    def subtract(self, other):
        if other.high <= self.low or self.high <= other.low:
            return [other]
        if self.low <= other.low and other.high <= self.high:
            return []
        if other.low < self.low and other.high <= self.high:
            return [TimeRange(other.low, self.low)]
        if self.low <= other.low and other.high > self.high:
            return [TimeRange(self.high, other.high)]
        # Split into two
        if self.low > other.low and self.high < other.high:
            return [TimeRange(other.low, self.low), TimeRange(self.high, other.high)]

    def __repr__(self):
        return "[" + str(self.low) + ", " + str(self.high) + "]"


# Testing
r1 = TimeRange(0, 5)
print(r1.subtract(TimeRange(2, 3)))
print(r1.subtract(TimeRange(-1, 3)))
print(r1.subtract(TimeRange(2, 7)))
print(r1.subtract(TimeRange(-1, 7)))
print(r1.subtract(TimeRange(-8, -5)))
print(r1.subtract(TimeRange(6, 7)))





