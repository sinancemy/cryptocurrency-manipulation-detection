from time import sleep

from torch.utils.data import Dataset
from analysis.trends import analyze_trends
from data.market.yahoo import YahooPriceCrawler
from data.social_media.reddit import ArchivedRedditCrawler
from data.social_media.twitter import TwitterCrawler
from data.database.database import *
from analysis.vectorize import Vocabulary, DiscreteDomain, PostVectorizer
from tqdm import tqdm


class CryptoSpeculationDataset(Dataset):
    def __init__(self, name, social_media_crawlers, price_crawler, coin_types, time_range):
        self.name = name
        # recreate_database()
        # self.data_collector = DataCollector(social_media_crawlers=social_media_crawlers,
        #                                     price_crawler=price_crawler)

        self.data_points = list()
        # for coin_type in coin_types:
        #     posts, prices = self.data_collector.collect(coin_type, time_range, price_window=60 * 60 * 24 * 60)
        #
        #     for post in posts:
        #         self.data_points.append(CryptoSpeculationDataPoint(post, prices))

        # TEMPORARY UNTIL DataCollector DEBUG:
        db = Database()
        posts = db.read_posts()
        prices = db.read_prices_by_time_and_coin_type(1577836800-60*60*24*60, 1609459200+60*60*24*60, CoinType.BTC)

        print("Generating discrete domains")
        content_vocab = Vocabulary([post.content for post in posts], 8192, 20, (4, 128), 20)
        user_domain = DiscreteDomain([post.user for post in posts], 256, 10, ["[deleted]", "AutoModerator"])
        source_domain = DiscreteDomain([post.source for post in posts], 128, 1)
        self.post_vectorizer = PostVectorizer(content_vocab, user_domain, source_domain)
        for post in tqdm(posts, desc="Vectorizing Data"):
            point = CryptoSpeculationDataPoint(post, prices, self.post_vectorizer)  # TODO: Input "prices" should match coin, should be changed in DataCollector integration.
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


# 2020 - 2021 dataset generator
dataset = CryptoSpeculationDataset("2020-2021", [ArchivedRedditCrawler(1500), TwitterCrawler()], YahooPriceCrawler(),
                                   [CoinType.BTC, CoinType.ETH, CoinType.DOGE], TimeRange(1577836800, 1609459200))
