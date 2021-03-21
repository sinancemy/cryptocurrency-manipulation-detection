from torch.utils.data import Dataset

from analysis.trends import analyze_trends
from data.collector.twitter import TwitterCrawler
from data.reader.datareader import DataReader
from data.collector.yahoo import YahooPriceCrawler
from data.collector.reddit import ArchivedRedditCrawler

from data.database import *


class CryptoSpeculationDataset(Dataset):
    def __init__(self, name, social_media_crawlers, price_crawler, coin_types, time_range):
        self.name = name

        #recreate_database()
        self.data_reader = DataReader(social_media_crawlers=social_media_crawlers,
                                      price_crawler=price_crawler)

        self.data_points = list()
        for coin_type in coin_types:
            # Update the coin type of each collector.
            self.data_reader.update_coin_type(coin=coin_type)
            # Collect or read from the database.
            posts, prices = self.data_reader.read(time_range, price_window=60*60*24*60)
            for post in posts:
                self.data_points.append(CryptoSpeculationDataPoint(post, prices))

    def __len__(self):
        return len(self.data_points)

    def __getitem__(self, item):
        return self.data_points[item]


class CryptoSpeculationDataPoint:
    def __init__(self, post, prices):
        self.X = CryptoSpeculationX(post)
        assoc_prices = list(filter(
            lambda price: TimeRange(post.time - 60*60*24*60, post.time + 60*60*24*60).in_range(price.time),
            prices))
        self.y = CryptoSpeculationY(assoc_prices)

    def __repr__(self):
        return "X:\n" \
               "Content: %s\n" \
               "Author: %s\n" \
               "Source: %s\n" \
               "Interaction Score: %d\n" \
               "y:\n" \
               "EMA8: %f\n" \
               "SMA13: %f\n" \
               "SMA21: %f\n" \
               "SMA55: %f" % (self.X.content, self.X.user, self.X.source, self.X.interaction,
                              self.y.ema8, self.y.sma13, self.y.sma21, self.y.sma55)


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


dataset = CryptoSpeculationDataset("2020-2021", [ArchivedRedditCrawler(interval=60*60*24*7,
                                                                       api_settings={'limit': 50,
                                                                                     'score': '>5'}),
                                                 TwitterCrawler()],
                                   YahooPriceCrawler(resolution="1h"),
                                   [CoinType.BTC, CoinType.ETH, CoinType.DOGE], TimeRange(1608456250, 1609459250))

print(dataset.__len__())
print(dataset.__getitem__(69))
