import time

from data.collector.reddit import RealtimeRedditCrawler
from data.collector.twitter import TwitterCrawler
from data.collector.yahoo import YahooPriceCrawler
from data.reader.datareader import DataReader

from misc import TimeRange, CoinType

SLEEP_INTERVAL = 60 * 60

# Collect novel data.
if __name__ == "__main__":
    social_media_crawlers = [
        RealtimeRedditCrawler(collect_comments=True),
        TwitterCrawler()]
    price_crawler = YahooPriceCrawler(resolution="1h")
    data_reader = DataReader(social_media_crawlers=social_media_crawlers, price_crawler=price_crawler)
    coin_types = [CoinType.BTC, CoinType.ETH, CoinType.DOGE, CoinType.ADA, CoinType.LINK, CoinType.LTC, CoinType.OMG,
                  CoinType.XLM, CoinType.XRP]
    while True:
        # Wait until aligned with sleep_interval
        t = 1
        while t % SLEEP_INTERVAL != 0:
            t = int(time.time())
            time.sleep(1)

        posts = list()
        for c in coin_types:
            data_reader.update_coin_type(c)
            new_posts, _ = data_reader.read(TimeRange(t - 60 * 60 * 2, t), SLEEP_INTERVAL)
            posts += new_posts
        time.sleep(SLEEP_INTERVAL)
