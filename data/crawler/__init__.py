from misc import TimeRange
from types import SimpleNamespace


class Crawler(object):

    def __init__(self, **settings):
        self.settings = SimpleNamespace(**settings)

    def state(self) -> str:
        sorted_state = sorted(zip(self.settings.__dict__.keys(), self.settings.__dict__.values()), key=lambda d: d[0])
        return self.__class__.__name__ + "?" + \
               "&".join((str(i[0]) + "=" + str(i[1])
                         for i in sorted_state))

    def collect(self, time_range: TimeRange) -> list:
        raise NotImplementedError()
