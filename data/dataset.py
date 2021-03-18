import random

from torch.utils.data import Dataset

from analysis.trends import analyze_trends
from data.database.database import recreate_database
from data.datacollector import DataCollector
from data.market.yahoo import YahooPriceCrawler
from data.misc.misc import CoinType, TimeRange
from data.social_media.reddit import RedditCrawler
from data.social_media.twitter import TwitterCrawler


class CryptoSpeculationDataset(Dataset):
    def __init__(self, name, social_media_crawlers, price_crawler, coin_types, time_range):
        self.name = name
        recreate_database()
        self.data_collector = DataCollector(social_media_crawlers=social_media_crawlers,
                                            price_crawler=price_crawler)
        self.data_points = list()
        for coin_type in coin_types:
            posts, prices = self.data_collector.collect(coin_type, time_range, price_window=60 * 60 * 24 * 55)
            for post in posts:
                self.data_points.append(CryptoSpeculationDataPoint(post, prices))

    def __len__(self):
        len(self.data_points)

    def __getitem__(self, item):
        random.choice(self.data_points)


class CryptoSpeculationDataPoint:
    def __init__(self, post, prices):
        self.X = CryptoSpeculationX(post)
        self.y = CryptoSpeculationY(list(filter(
            lambda price: TimeRange(post.time - 60 * 60 * 24 * 55, post.time + 60 * 60 * 24 * 55).in_range(price.time),
            prices)))


class CryptoSpeculationX:
    def __init__(self, post):
        self.content = post.content
        self.user = post.user
        self.source = post.source
        self.interaction = post.interaction
        # self.coin_type = post.coin_type


class CryptoSpeculationY:
    def __init__(self, price):
        self.ema8, self.sma13, self.sma21, self.sma55 = analyze_trends(price)


# dataset = CryptoSpeculationDataset("2020-2021", [RedditCrawler()], YahooPriceCrawler(),
#                                    [CoinType.BTC, CoinType.ETH, CoinType.DOGE], TimeRange(1577836800, 1609459200))

# print(dataset.__getitem__(1))
