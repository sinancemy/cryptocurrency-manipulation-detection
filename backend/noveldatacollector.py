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
    coin_types = [CoinType.btc, CoinType.eth, CoinType.doge, CoinType.ada, CoinType.link, CoinType.ltc, CoinType.omg,
                  CoinType.xlm, CoinType.xrp]
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
        # At this point, post volumes are calculated.
        # TODO: Deploy the notifications!
        # 1h, 2h, 1d degisimleri hesapla
        # Etkilenen triggerlari bul
        # O triggerlarin userlarina notification at
        # Notify_email 1 ise mail de at ayni zamanda!
        time.sleep(SLEEP_INTERVAL)
