import twint
import datetime
from data.database.models import Post

# We will open these when we carry this over to a server.
#usernames = ["officialmcafee", "VitalikButerin", "SatoshiLite", "pmarca", "rogerkver", "aantonop", "ErikVoorhees", "NickSzabo4", "CryptoYoda1338", "bgarlinghouse", "WhalePanda", "cryptoSqueeze", "ZeusZissou", "Beastlyorion", "bitcoin_dad", "jebus911", "Sicarious", "CryptoMessiah", "APompliano", "nic__carter", "CarpeNoctom", "Melt_Dem", "100trillionUSD", "MessariCrypto", "TuurDemeester", "MartyBent", "elonmusk"]
coins = ["Bitcoin", "BTC", "btc", "Ethereum", "ETH", "eth", "Dogecoin", "DOGE", "doge", "Cardano", "ADA", "ada", "Chainlink", "LINK", "link", "Polkadot", "DOT", "dot", "Binance coin", "BNB", "bnb", "Ripple", "XRP", "xrp", "OMG Network", "OMG", "omg", "Litecoin", "LTC", "ltc", "Stellar", "XLM", "xlm", "Basic Attraction Token", "BAT", "bat", "Avalanche", "AVAX", "avax", "Ravencoin", "RVN", "rvn", "Maker", "MKR", "mkr", "Chiliz", "CHZ", "chz"]

usernames = ["elonmusk", "SatoshiLite"]
#coins = ["Bitcoin", "Doge"]


def get_tweets(coin):
    # TODO: Think about a good timer
    # threading.Timer(10.0, get_tweets).start()
    posts = []
    print("TwitterCrawler: Currently searching", coin)
    for username in usernames:
        print("TwitterCrawler: Current user @" + username)
        tweets = []
        c = twint.Config()
        c.Limit = 1
        c.Username = username
        c.Search = coin
        c.Store_object = True
        c.Store_object_tweets_list = tweets
        c.Hide_output = True
        twint.run.Search(c)
        for tweet in tweets:
            tweet_id = tweet.id
            username = tweet.username
            tweet_body = tweet.tweet
            interaction_score = calculate_interaction_score(tweet.replies_count, tweet.likes_count,
                                                            tweet.retweets_count)
            unix_timestamp = convert_to_unix(tweet.datestamp, tweet.timestamp)
            comment_model = Post("tw" + str(tweet_id), username, tweet_body, interaction_score, "twitter",
                                 unix_timestamp)
            posts.append(comment_model)
    return posts

def calculate_interaction_score(replies_count, likes_count, retweet_count):
    return int(replies_count) + int(likes_count) + int(retweet_count)

def convert_to_unix(datestamp, timestamp):
    date = datestamp.split("-")
    time = timestamp.split(":")
    date_time = datetime.datetime(int(date[0]), int(date[1]), int(date[2]), int(time[0]), int(time[1]), 0)
    return int(date_time.timestamp())