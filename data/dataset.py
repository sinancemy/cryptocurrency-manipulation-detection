from data.database.database import recreate_database
from data.datacollector import DataCollector
from data.market.yahoo import YahooPriceCrawler
from data.misc.misc import CoinType, TimeRange
from data.social_media.reddit import RedditCrawler
from data.social_media.twitter import TwitterCrawler


class CryptoSpeculationDataset(object):
    def __init__(self, name, social_media_crawlers, price_crawler, coin_types, time_range):
        self.name = name
        recreate_database()
        self.data_collector = DataCollector(social_media_crawlers=social_media_crawlers,
                                            price_crawler=price_crawler)
        posts, prices = list(), list()
        for coin_type in coin_types:
            new_posts, new_prices = self.data_collector.collect(coin_type, time_range, price_window=60 * 60 * 24 * 55)
            posts += new_posts
            new_prices += new_prices

    def __len__(self):
        pass

    def __getitem__(self, item):
        pass


recreate_database()
dataset = CryptoSpeculationDataset("2020-2021", [RedditCrawler(), TwitterCrawler()], YahooPriceCrawler(),
                                   [CoinType.BTC, CoinType.ETH, CoinType.DOGE], TimeRange(1575072000, 1606694400))
