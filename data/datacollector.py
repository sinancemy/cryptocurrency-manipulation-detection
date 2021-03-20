from data.reader.cachedreader import CachedReader
from data.crawler import MarketPriceCrawler
from data.database.database import Database
from data.database.models import CachedRange
from misc.misc import CoinType, TimeRange
from functools import reduce


# Either collects from the database or from the crawlers.
class DataCollector(object):
    def __init__(self, social_media_crawlers: list, price_crawler: MarketPriceCrawler):
        # Connect to the database
        self.db = Database()
        # Crate a database cache handler.
        self.db_cache = CachedReader(lambda range_type:
                                     list(map(lambda cr: cr.range, self.db.read_cached_ranges_by_type(range_type))))
        self.social_media_crawlers = social_media_crawlers
        self.price_crawler = price_crawler

    def __collect_all_posts(self, coin: CoinType, time_range: TimeRange):
        return reduce(list.__add__, map(lambda c: c.collect_posts(coin, time_range), self.social_media_crawlers))

    def collect_prices(self, coin: CoinType, time_range: TimeRange, resolution: str):
        range_type = "price_" + coin.value
        # Get the price ranges that are already in the database and the ones that are not.
        db_ranges, crawler_ranges = self.db_cache.find_ranges(range_type, time_range)
        collected_prices = []
        for db_range in db_ranges:
            # Retrieve from the database.
            collected_prices += self.db.read_prices_by_time_and_coin_type(db_range.low, db_range.high, coin)
        for cr_range in crawler_ranges:
            # Invoke the crawler to get the prices in the range.
            crawler_collected_prices = self.price_crawler.collect_prices(coin, cr_range, resolution)
            # Save the collected prices into the database.
            self.db.create_prices(crawler_collected_prices)
            collected_prices += crawler_collected_prices
        # Save the newly cached ranges into the database.
        if len(crawler_ranges) > 0:
            self.db.create_cached_ranges(map(lambda cr: CachedRange(cr.low, cr.high, range_type), crawler_ranges))
        # Sort the price information by time and return.
        return sorted(filter(lambda p: time_range.in_range(p.time), collected_prices), key=lambda p: p.time)

    def collect_posts(self, coin: CoinType, time_range: TimeRange):
        range_type = "post_" + coin.value
        # Get the post ranges that are already in the database and the ones that are not.
        db_ranges, crawler_ranges = self.db_cache.find_ranges(range_type, time_range)
        collected_posts = []
        for db_range in db_ranges:
            # Retrieve from the database.
            collected_posts += self.db.read_posts_by_time_and_coin_type(db_range.low, db_range.high, coin)
        for cr_range in crawler_ranges:
            # Invoke the crawler to get the posts in the range.
            crawler_collected_posts = self.__collect_all_posts(coin, cr_range)
            # Save the collected posts into the database.
            self.db.create_posts(crawler_collected_posts)
            collected_posts += crawler_collected_posts
        # Save the newly cached ranges into the database.
        if len(crawler_ranges) > 0:
            self.db.create_cached_ranges(map(lambda cr: CachedRange(cr.low, cr.high, range_type), crawler_ranges))
        # Sort the posts by time and return.
        return sorted(filter(lambda p: time_range.in_range(p.time), collected_posts), key=lambda p: p.time)

    def collect(self, coin: CoinType, time_range: TimeRange, price_window: int) -> (list, list):
        print("DataCollector: Invoked for", coin.value, "within", time_range)
        # Collect all the posts within the time range.
        collected_posts = self.collect_posts(coin, time_range)
        # Collect all the possible prices according to the window.
        collected_prices = []
        if len(collected_posts) > 0:
            min_price_time = collected_posts[0].time - price_window
            max_price_time = collected_posts[-1].time + price_window
            collected_prices = self.collect_prices(coin, TimeRange(min_price_time, max_price_time), "1h")
        return collected_posts, collected_prices


# Cached range test.
# dc = DataCollector([], [])
# cached_ranges = [
#     TimeRange(0, 3),
#     TimeRange(5, 8),
#     TimeRange(10, 13),
# ]
# res = dc.find_ranges(cached_ranges, TimeRange(-1, 15))
# print(res)
