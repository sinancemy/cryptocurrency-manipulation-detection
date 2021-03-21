from time import sleep

from torch.utils.data import Dataset

from analysis.trends import analyze_trends
from data.collector.twitter import TwitterCrawler
from data.reader.datareader import DataReader
from data.collector.yahoo import YahooPriceCrawler
from data.collector.reddit import ArchivedRedditCrawler

from analysis.vectorize import Vocabulary, DiscreteDomain, PostVectorizer
from tqdm import tqdm

from data.database import *


class CryptoSpeculationDataset(Dataset):
    def __init__(self, name, social_media_crawlers, price_crawler, coin_types, time_range):
        self.name = name

        self.data_reader = DataReader(social_media_crawlers=social_media_crawlers, price_crawler=price_crawler)

        posts = list()
        prices = dict()
        for coin_type in coin_types:
            # Update the coin type of each collector.
            self.data_reader.update_coin_type(coin=coin_type)
            # Collect or read from the database.
            new_posts, prices[coin_type] = self.data_reader.read(time_range, price_window=60 * 60 * 24 * 60)
            posts += new_posts

        self.data_points = list()
        print("Generating discrete domains")
        content_vocab = Vocabulary([post.content for post in posts], 8192, 20, (4, 128), 20)
        user_domain = DiscreteDomain([post.user for post in posts], 256, 1, ["[deleted]", "AutoModerator"])
        source_domain = DiscreteDomain([post.source for post in posts], 128, 1)
        self.post_vectorizer = PostVectorizer(content_vocab, user_domain, source_domain)
        for post in tqdm(posts, desc="Vectorizing Data"):
            point = CryptoSpeculationDataPoint(post, prices[post.coin_type],
                                               self.post_vectorizer)
            if point.X.content is not None:
                self.data_points.append(point)
        print(self)

    def __len__(self):
        return len(self.data_points)

    def __getitem__(self, item):
        return self.data_points[item]

    def __repr__(self):
        return "CryptoSpeculationDataset: %s\n" \
               "\t- Number of data points: %d\n" \
               "\t- Vocab size: %d\n" \
               "\t- Sentence length: %d\n" \
               "\t- User domain size: %d\n" \
               "\t- Source domain size: %d\n" \
               % (self.name, len(self.data_points), len(self.post_vectorizer.v),
                  self.post_vectorizer.v.max_sentence_length, len(self.post_vectorizer.u), len(self.post_vectorizer.s))

    def save(self, save_dir):
        pass

    def load(self, load_dir):
        pass


class CryptoSpeculationDataPoint:
    def __init__(self, post, prices, post_vectorizer):
        self.X = CryptoSpeculationX(post, post_vectorizer)
        self.y = CryptoSpeculationY(list(filter(
            lambda price: TimeRange(post.time - 60 * 60 * 24 * 60, post.time + 60 * 60 * 24 * 60).in_range(price.time),
            prices)))

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
    def __init__(self, post, vectorizer):
        self.content, self.user, self.source, self.interaction = vectorizer.vectorize(post)
        # self.coin_type = post.coin_type


class CryptoSpeculationY:
    def __init__(self, price):
        self.ema8, self.sma13, self.sma21, self.sma55 = analyze_trends(price)


# recreate_database()
dataset = CryptoSpeculationDataset("2020-2021",
                                   [ArchivedRedditCrawler(interval=60 * 60 * 24 * 7, api_settings={'limit': 100}),
                                    TwitterCrawler()], YahooPriceCrawler(resolution="1h"),
                                   [CoinType.BTC, CoinType.ETH, CoinType.DOGE], TimeRange(1609456250, 1609459250))

print(dataset.__len__())
print(dataset.__getitem__(69))
