from misc.misc import TimeRange


class Crawler(object):

    def __init__(self, **settings):
        self.__dict__.update(settings)

    def state(self) -> str:
        return self.__class__.__name__ + "?" + \
               "&".join((str(i[0]) + "=" + str(i[1]) for i in zip(self.__dict__.keys(), self.__dict__.values())))

    def collect(self, time_range: TimeRange) -> list:
        raise NotImplementedError()
