import enum
from datetime import datetime
from enum import Enum
import os

import portion as P


class CoinType(str, Enum):
    btc = "btc"
    eth = "eth"
    doge = "doge"
    ada = "ada"
    link = "link"
    dot = "dot"
    xrp = "xrp"
    ltc = "ltc"
    xlm = "xlm"
    omg = "omg"


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


def closed_distinct_intervals(closed_time_range: TimeRange, open_length: int) -> iter:
    for start in range(closed_time_range.low, closed_time_range.high-1, open_length + 1):
        yield TimeRange(start, min(start + open_length, closed_time_range.high))


def interval_to_time_range(p: P.Interval):
    if p.empty:
        return None
    # low = p.lower + 1 if p.left == P.OPEN else p.lower
    # high = p.upper - 1 if p.right == P.OPEN else p.upper
    return TimeRange(p.lower, p.upper)


def chdir_to_main():
    while not {".gitignore"} <= set(os.listdir()):
        os.chdir("../")


class TriggerTimeWindow(str, enum.Enum):
    one_hour = "1h"
    two_hours = "2h"
    five_hours = "5h"
    one_day = "1d"


def get_trigger_time_window_seconds(w: TriggerTimeWindow) -> int:
    if w == TriggerTimeWindow.one_hour:
        return 60 * 60
    if w == TriggerTimeWindow.two_hours:
        return 2 * 60 * 60
    if w == TriggerTimeWindow.five_hours:
        return 5 * 60 * 60
    if w == TriggerTimeWindow.one_day:
        return 24 * 60 * 60
    return None


class FollowType(str, enum.Enum):
    coin = "coin"
    source = "source"