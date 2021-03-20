import twint
import datetime
from data.database.models import Post
from data.crawler import Crawler
from misc.misc import TimeRange, CoinType

usernames = ["officialmcafee", "VitalikButerin", "SatoshiLite", "pmarca", "rogerkver", "aantonop", "ErikVoorhees",
             "NickSzabo4", "CryptoYoda1338", "bgarlinghouse", "WhalePanda", "cryptoSqueeze", "ZeusZissou",
             "Beastlyorion", "bitcoin_dad", "jebus911", "Sicarious", "CryptoMessiah", "APompliano", "nic__carter",
             "CarpeNoctom", "Melt_Dem", "100trillionUSD", "MessariCrypto", "TuurDemeester", "MartyBent", "elonmusk"]

# coins = ["Bitcoin", "BTC", "btc", "Ethereum", "ETH", "eth", "Dogecoin", "DOGE", "doge", "Cardano", "ADA", "ada",
# "Chainlink", "LINK", "link", "Polkadot", "DOT", "dot", "Binance coin", "BNB", "bnb", "Ripple", "XRP", "xrp",
# "OMG Network", "OMG", "omg", "Litecoin", "LTC", "ltc", "Stellar", "XLM", "xlm", "Basic Attraction Token", "BAT",
# "bat", "Avalanche", "AVAX", "avax", "Ravencoin", "RVN", "rvn", "Maker", "MKR", "mkr", "Chiliz", "CHZ", "chz"]

# usernames = ["elonmusk", "SatoshiLite"]
# coins = ["Bitcoin", "Doge"]

COIN_KEYWORDS = {
    CoinType.BTC: ["Bitcoin", "BTC"],
    CoinType.ETH: ["Ethereum", "ETH"],
    CoinType.DOGE: ["Dogecoin"]
}


def calculate_interaction_score(replies_count, likes_count, retweet_count):
    return int(replies_count) + int(likes_count) + int(retweet_count)


def convert_to_unix(datestamp, timestamp):
    date = datestamp.split("-")
    time = timestamp.split(":")
    date_time = datetime.datetime(int(date[0]), int(date[1]), int(date[2]), int(time[0]), int(time[1]), 0)
    return int(date_time.timestamp())


class TwitterCrawler(Crawler):
    def __init__(self, coin: CoinType):
        super().__init__(coin=coin)
        self.config = twint.Config()
        self.config.Limit = 1
        self.config.Store_object = True
        self.config.Hide_output = True

    def collect(self, time_range: TimeRange):
        posts = []
        for username in usernames:
            print("TwitterCrawler:", "Collecting from @" + username, "with time range", time_range)
            tweets = []
            self.config.Username = username
            self.config.Store_object_tweets_list = tweets
            for keyword in COIN_KEYWORDS[self.coin]:
                self.config.Search = keyword
                try:
                    twint.run.Search(self.config)
                except Exception as e:
                    print("TwitterCrawler: An occurred, skipping the keyword...")
                    print(e)
                    continue
                for tweet in tweets:
                    unix_timestamp = convert_to_unix(tweet.datestamp, tweet.timestamp)
                    if time_range.is_higher(unix_timestamp):
                        continue
                    elif time_range.is_lower(unix_timestamp):
                        break
                    # print("TwitterCrawler:", "Found tweet that includes", keyword, "with date", tweet.datestamp,
                    #       tweet.timestamp)
                    tweet_id = tweet.id
                    username = tweet.username
                    tweet_body = tweet.tweet
                    interaction_score = calculate_interaction_score(tweet.replies_count, tweet.likes_count,
                                                                    tweet.retweets_count)
                    comment_model = Post(unique_id="tw" + str(tweet_id), user=username, content=tweet_body,
                                         interaction=interaction_score, source="twitter", time=unix_timestamp,
                                         coin_type=self.coin)
                    posts.append(comment_model)
        return posts

# For Testing
# TwitterCrawler().collect_posts(CoinType.BTC, TimeRange(int(datetime.datetime.now().timestamp()) - 86400 * 10,
#                                                        int(datetime.datetime.now().timestamp())))
