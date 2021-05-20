import functools

import twint
import datetime
from data.database import Post
from data.collector import Collector
from misc import TimeRange, CoinType
import os
import csv

LIMIT = True

usernames = ["officialmcafee", "VitalikButerin", "SatoshiLite", "pmarca", "rogerkver", "aantonop", "ErikVoorhees",
             "NickSzabo4", "CryptoYoda1338", "bgarlinghouse", "WhalePanda", "cryptoSqueeze", "ZeusZissou",
             "Beastlyorion", "bitcoin_dad", "jebus911", "Sicarious", "CryptoMessiah", "APompliano", "nic__carter",
             "CarpeNoctom", "Melt_Dem", "100trillionUSD", "MessariCrypto", "TuurDemeester", "MartyBent", "elonmusk"]

COIN_KEYWORDS = {
    CoinType.btc: ["Bitcoin", "BTC"],
    CoinType.eth: ["Ethereum", "ETH"],
    CoinType.doge: ["Dogecoin", "DOGE"],
    CoinType.ada: ["Cardano", "ADA"],
    CoinType.link: ["Chainlink", "LINK"],
    CoinType.dot: ["Polkadot", "DOT"],
    CoinType.xrp: ["Ripple", "XRP"],
    CoinType.ltc: ["Litecoin", "LTC"],
    CoinType.xlm: ["Stellar", "XLM"],
    CoinType.omg: ["omgnetwork", "OMG"],
}


def calculate_interaction_score(replies_count, likes_count, retweet_count):
    return int(replies_count) + int(likes_count) + int(retweet_count)


def convert_to_unix(datestamp):
    date, hour, _ = datestamp.split(" ")
    date = date.split("-")
    hour = hour.split(":")
    date_time = datetime.datetime(year=int(date[0]), month=int(date[1]), day=int(date[2]), hour=int(hour[0]),
                                  minute=int(hour[1]), second=int(hour[2]))
    return int(date_time.timestamp())


def convert_to_date(time_range: TimeRange):
    lower_date = datetime.datetime.fromtimestamp(time_range.low - 86400).strftime("%Y-%m-%d")
    upper_date = datetime.datetime.fromtimestamp(time_range.high + 86400).strftime("%Y-%m-%d")
    return lower_date, upper_date


class TwitterCrawler(Collector):
    def __init__(self, coin: CoinType = CoinType.btc, only_users=False):
        super().__init__(coin=coin, only_users=only_users)
        self.config = twint.Config()
        if LIMIT:
            self.config.Limit = 1
        self.config.Store_csv = True
        self.config.Output = "out.csv"
        self.config.Resume = "out_last.csv"
        self.config.Debug = True
        self.config.Lang = "en"
        self.config.Hide_output = True

    @staticmethod
    def get_all_sources() -> list:
        return ["*@twitter/" + s for s in functools.reduce(list.__add__, COIN_KEYWORDS.values())]

    def collect(self, time_range: TimeRange):
        lower, upper = convert_to_date(time_range)
        self.config.Since = lower
        self.config.Until = upper
        print("TwitterCrawler: Collecting...")
        for keyword in COIN_KEYWORDS[self.settings.coin]:
            if self.settings.only_users:
                for username in usernames:
                    self.config.Username = username
                    self.config.Search = keyword
                    while True:
                        try:
                            twint.run.Search(self.config)
                            break
                        except:
                            pass
                    os.remove("out_last.csv")
                    os.remove("twint-last-request.log")
                    os.remove("twint-request_urls.log")
                    with open("out.csv", "r") as file:
                        next(file)
                        reader = csv.reader(file)
                        for row in reader:
                            unix_timestamp = convert_to_unix(row[2])
                            if time_range.low < time_range.high < unix_timestamp:
                                continue
                            if unix_timestamp < time_range.low < time_range.high:
                                break

                            yield Post(unique_id="tw" + row[0], user=row[7], content=row[10],
                                       interaction=calculate_interaction_score(int(row[15]), int(row[17]),
                                                                               int(row[16])),
                                       source="twitter/" + keyword.lower(),
                                       time=unix_timestamp,
                                       coin_type=self.settings.coin)

                    os.remove("out.csv")
            else:
                self.config.Search = "#" + keyword
                while True:
                    try:
                        twint.run.Search(self.config)
                        break
                    except:
                        pass
                os.remove("out_last.csv")
                os.remove("twint-last-request.log")
                os.remove("twint-request_urls.log")
                with open("out.csv", "r") as file:
                    next(file)
                    reader = csv.reader(file)
                    for row in reader:
                        unix_timestamp = convert_to_unix(row[2])
                        if time_range.low < time_range.high < unix_timestamp:
                            continue
                        if unix_timestamp < time_range.low < time_range.high:
                            break

                        yield Post(unique_id="tw" + row[0], user=row[7], content=row[10],
                                   interaction=calculate_interaction_score(int(row[15]), int(row[17]), int(row[16])),
                                   source="twitter/" + keyword.lower(),
                                   time=unix_timestamp,
                                   coin_type=self.settings.coin)

                os.remove("out.csv")
