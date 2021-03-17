class TimeRange(object):
    def __init__(self, low=-1, high=-1):
        self.low = low
        self.high = high

    def in_range(self, timestamp):
        low_check = self.low == -1 or timestamp >= self.low
        high_check = self.high == -1 or timestamp <= self.high
        return low_check and high_check

    def is_lower(self, timestamp):
        return self.low > -1 and timestamp < self.low

    def is_higher(self, timestamp):
        return self.high > -1 and timestamp > self.high
