from data.database.database import Database
from data.misc.misc import CoinType, TimeRange


class DataCollector:
    def __init__(self, social_media_crawlers: list, price_crawlers: list):
        # Connect to the database
        self.db = Database()
        self.social_media_crawlers = social_media_crawlers
        self.price_crawlers = price_crawlers

    def get_prices(self, coin: CoinType, time_range: TimeRange):
        pass

    def get_posts(self, coin: CoinType, time_range: TimeRange):
        pass

    def collect(self, coin: CoinType, time_range: TimeRange):
        pass
