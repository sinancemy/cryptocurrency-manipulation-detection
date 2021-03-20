from data.crawler import Crawler
from data.database import Database, row_to_post, row_to_price
from data.reader.cachedreader import CachedReader
from misc import CoinType, TimeRange
from functools import reduce


# Either reads from the database or collects from the crawlers.
class DataReader(object):
    def __init__(self, social_media_crawlers: list, price_crawler: Crawler):
        # Connect to the database
        self.db = Database()
        # Converts the crawlers into cached readers.
        self.cached_post_readers = [CachedReader(c, self.db, "posts", row_to_post, self.db.create_posts)
                                    for c in social_media_crawlers]
        self.cached_price_reader = CachedReader(price_crawler, self.db, "prices", row_to_price, self.db.create_prices)

    def read(self, coin: CoinType, time_range: TimeRange, price_window: int) -> (list, list):
        print("DataCollector: Invoked for", coin.value, "within", time_range)
        # Collect all the posts within the time range.
        posts = reduce(list.__add__, map(lambda c: c.read_cached(coin, time_range), self.cached_post_readers))
        # Collect all the possible prices according to the window.
        prices = []
        if len(posts) > 0:
            min_price_time = posts[0].time - price_window
            max_price_time = posts[-1].time + price_window
            prices = self.cached_price_reader.read_cached(TimeRange(min_price_time, max_price_time))
        return posts, prices
