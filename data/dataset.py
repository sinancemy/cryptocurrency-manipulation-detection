import os.path
import random
from pathlib import Path

from torch.utils.data import Dataset
from torch import FloatTensor, IntTensor
import numpy as np
from tqdm import tqdm

from data.reader.datareader import DataReader
from analysis.trends import analyze_trends
from data.vectorize import Vocabulary, DiscreteDomain, Vectorizer
from misc import TimeRange, CoinType, chdir_to_main

# TODO: Documentation

chdir_to_main()
DATASETS_DIR = "data/datasets"


class CryptoSpeculationDataset(Dataset):
    def __init__(self, name, **create_args):
        self.name = name

        if len(create_args) == 0:
            self.load()
        elif len(create_args) == 2:
            self.data_points = create_args["data_points"]
            self.vectorizer = create_args["vectorizer"]
        elif len(create_args) == 4:
            social_media_crawlers = create_args["social_media_crawlers"]
            price_crawler = create_args["price_crawler"]
            coin_types = create_args["coin_types"]
            time_range = create_args["time_range"]

            self.data_reader = DataReader(social_media_crawlers=social_media_crawlers, price_crawler=price_crawler)

            posts = list()
            prices = dict()
            for coin_type in coin_types:
                # Update the coin type of each collector.
                self.data_reader.update_coin_type(coin=coin_type)
                # Collect or read from the database.
                new_posts, prices[coin_type] = self.data_reader.read(time_range, price_window=60 * 60 * 24 * 15)
                posts += new_posts

            self.data_points = list()
            print("Generating discrete domains")
            content_vocab = Vocabulary([post.content for post in posts], 8192, 16, (4, 128), 24)
            user_domain = DiscreteDomain([post.user for post in posts], 1024, 10, ["elonmusk"],
                                         ["[deleted]", "AutoModerator"])
            source_domain = DiscreteDomain([post.source for post in posts], 128, 1)
            coin_domain = DiscreteDomain([post.coin_type.value for post in posts], 128, 1)
            self.vectorizer = Vectorizer(
                content_vocab, user_domain, source_domain, coin_domain)
            for post in tqdm(posts, desc="Vectorizing Data"):
                point = CryptoSpeculationDataPoint(post=post, prices=prices[post.coin_type],
                                                   vectorizer=self.vectorizer)
                if point.X.content is not None:
                    self.data_points.append(point)

            random.shuffle(self.data_points)
        else:
            raise Exception("Can't initialize CryptoSpeculationDataset from %d create_args." % len(create_args))

    def __len__(self):
        return len(self.data_points)

    def __getitem__(self, index):
        item = self.data_points[index]
        return (IntTensor(item.X.content), FloatTensor(item.X.user),
                FloatTensor(item.X.source), FloatTensor([item.X.interaction]),
                FloatTensor(item.y.impact))

    def __repr__(self):
        return "CryptoSpeculationDataset: %s\n" \
               "\t- Number of data points: %d\n" \
               "\t- Vocab size: %d\n" \
               "\t- Sentence length: %d\n" \
               "\t- User domain size: %d\n" \
               "\t- Source domain size: %d\n" \
               "\t- Coin domain size: %d\n" \
               % (self.name, len(self.data_points), len(self.vectorizer.domains[0]),
                  self.vectorizer.domains[0].max_sentence_length, len(self.vectorizer.domains[1]),
                  len(self.vectorizer.domains[2]), len(self.vectorizer.domains[3]))

    def partition(self, coefficient):
        partition_index = int(len(self) * coefficient)
        return (CryptoSpeculationDataset("%s_train" % self.name,
                                         data_points=self.data_points[0:partition_index],
                                         vectorizer=self.vectorizer),
                CryptoSpeculationDataset("%s_test" % self.name,
                                         data_points=self.data_points[partition_index:len(self.data_points)],
                                         vectorizer=self.vectorizer))

    def save(self):
        meta = [self.vectorizer.domains[0].max_sentence_length, len(self.vectorizer.domains[1]),
                len(self.vectorizer.domains[2]), len(self.vectorizer.domains[3]), 1, 4]
        data = np.vstack([np.hstack(
            (point.X.content, point.X.user, point.X.source, point.X.coin, point.X.interaction, point.y.impact))
            for point in self.data_points])
        Path(os.path.join(DATASETS_DIR, self.name)).mkdir(parents=True, exist_ok=True)
        np.savez_compressed(os.path.join(DATASETS_DIR, self.name, "data.npz"), data=data, meta=meta)
        self.vectorizer.save(os.path.join(DATASETS_DIR, self.name, "mappings.vectorizer"))

    def load(self):
        data = np.load(os.path.join(DATASETS_DIR, self.name, "data.npz"))
        meta = data["meta"]
        data = data["data"]
        self.data_points = list()
        for point in data:
            self.data_points.append(CryptoSpeculationDataPoint(
                content=point[0:sum(meta[0:1])], user=point[sum(meta[0:1]):sum(meta[0:2])],
                source=point[sum(meta[0:2]):sum(meta[0:3])], coin=point[sum(meta[0:3]):sum(meta[0:4])],
                interaction=point[sum(meta[0:4]):sum(meta[0:5])], impact=point[sum(meta[0:5]):sum(meta[0:6])]
            ))
        self.vectorizer = Vectorizer()
        self.vectorizer.load(os.path.join(DATASETS_DIR, self.name, "mappings.vectorizer"))


class PredictSet(Dataset):
    def __init__(self, posts, vectorizer):
        self.X = []
        self.posts = posts
        for post in posts:
            self.X.append(CryptoSpeculationX(post=post, vectorizer=vectorizer))

    def __getitem__(self, index):
        x = self.X[index]
        if x.content is None:
            x.content = np.zeros((128))
        return (IntTensor(x.content), FloatTensor(x.user),
                FloatTensor(x.source), FloatTensor([x.interaction]))

    def __len__(self):
        return len(self.X)


def load_vectorizer_of(dataset_name):
    vectorizer = Vectorizer()
    vectorizer.load(os.path.join(DATASETS_DIR, dataset_name, "mappings.vectorizer"))
    return vectorizer


class CryptoSpeculationDataPoint:
    def __init__(self, **kwargs):
        if len(kwargs) == 3:
            post = kwargs["post"]
            prices = kwargs["prices"]
            vectorizer = kwargs["vectorizer"]
            self.X = CryptoSpeculationX(post=post, vectorizer=vectorizer)
            self.y = CryptoSpeculationY(prices=list(filter(
                lambda price: TimeRange(post.time - 60 * 60 * 24 * 15, post.time + 60 * 60 * 24 * 15).in_range(
                    price.time), prices)))
        elif len(kwargs) == 6:
            self.X = CryptoSpeculationX(content=kwargs["content"], user=kwargs["user"],
                                        source=kwargs["source"], coin=kwargs["coin"],
                                        interaction=kwargs["interaction"])
            self.y = CryptoSpeculationY(impact=kwargs["impact"])

    def __repr__(self):
        def format_array_repr(a):
            return np.array_repr(a).replace('\n', '').replace(' ', '').replace("array(", "").replace(")", "").replace(
                ",", " ")

        return "X:\n" \
               "\t- Content: %s\n" \
               "\t- Author: %s\n" \
               "\t- Source: %s\n" \
               "\t- Coin: %s\n" \
               "\t- Interaction Score: %d\n" \
               "y:\n" \
               "\t- EMA8: %f\n" \
               "\t- SMA13: %f\n" \
               "\t- SMA21: %f\n" \
               "\t- SMA55: %f" % (format_array_repr(self.X.content), format_array_repr(self.X.user),
                                  format_array_repr(self.X.source), format_array_repr(self.X.coin), self.X.interaction,
                                  self.y.impact[0], self.y.impact[1], self.y.impact[2], self.y.impact[3])


class CryptoSpeculationX:
    def __init__(self, **kwargs):
        if len(kwargs) == 2:
            post = kwargs["post"]
            vectorizer = kwargs["vectorizer"]
            self.content, self.user, self.source, self.coin = vectorizer.vectorize(
                post.content, post.user, post.source, post.coin_type)
            self.interaction = post.interaction
        elif len(kwargs) == 5:
            self.content = np.array(kwargs["content"], dtype=int)
            self.user = np.array(kwargs["user"], dtype=int)
            self.source = np.array(kwargs["source"], dtype=int)
            self.coin = np.array(kwargs["coin"], dtype=int)
            self.interaction = int(kwargs["interaction"][0])


class CryptoSpeculationY:
    def __init__(self, **kwargs):
        if "impact" in kwargs:
            self.impact = kwargs["impact"]
        elif "prices" in kwargs:
            self.impact = np.array(analyze_trends(kwargs["prices"]))


def _example():
    from data.collector.yahoo import YahooPriceCrawler
    from data.collector.reddit import ArchivedRedditCrawler
    from data.collector.twitter import TwitterCrawler

    dataset = CryptoSpeculationDataset("sample_set_2020_2021", social_media_crawlers=[
        ArchivedRedditCrawler(interval=60 * 60 * 24 * 60, api_settings={'limit': 100, 'score': '>7'},
                              collect_comments=True)],
                                       price_crawler=YahooPriceCrawler(resolution="1h"),
                                       coin_types=[CoinType.btc],
                                       time_range=TimeRange(1577836800, 1578836800))
    dataset.save()


def _collect_dataset():
    from data.collector.yahoo import YahooPriceCrawler
    from data.collector.reddit import ArchivedRedditCrawler
    from data.collector.twitter import TwitterCrawler

    print("Collecting dataset")
    dataset = CryptoSpeculationDataset("Jun19_May21_Big", social_media_crawlers=[
        ArchivedRedditCrawler(interval=60 * 60 * 24 * 7, api_settings={'limit': 1000, 'score': '>7'}),
        TwitterCrawler(only_users=True)],
                                       price_crawler=YahooPriceCrawler(resolution="1h"),
                                       coin_types=[CoinType.btc, CoinType.eth, CoinType.doge, CoinType.ada,
                                                   CoinType.link, CoinType.ltc, CoinType.omg,
                                                   CoinType.xlm, CoinType.xrp],
                                       time_range=TimeRange(1560556800, 1619827200))
    dataset.save()
