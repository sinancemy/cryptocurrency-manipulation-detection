from data.database.database import recreate_database, CoinType
from data.datacollector import DataCollector
from data.market.yahoo import YahooPriceCrawler
from data.misc.misc import TimeRange
from data.social_media.reddit import RealtimeRedditCrawler
from data.social_media.twitter import TwitterCrawler

#recreate_database()

dc = DataCollector(social_media_crawlers=[RealtimeRedditCrawler(), TwitterCrawler()],
                   price_crawler=YahooPriceCrawler())
# Collect posts within a range with price window of 55 days.
posts, prices = dc.collect(coin=CoinType.BTC, time_range=TimeRange(1616053072-10*60*60, 1616053072),
                           price_window=60*60*24*55)

print(posts)
print(prices)
