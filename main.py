from database.database import Database, recreate_database
import data.crawlers.reddit as rd_crawler
import data.market as mrk_crawler
import time

print("Recreating the database...")
recreate_database()

print("Connecting to the database...")
db = Database()

print("Gathering from Reddit...")
reddit_posts = rd_crawler.get_reddit_posts_as_models(limit=10)
print("Reddit posts gathered. Inserting into the database...")
db.insert_posts(reddit_posts)
print("Gathering from Twitter...")
tw_crawler = None
# TBD
print("Gathering price information...")
# Gather bitcoin price information for the last 1 hour with 1 minute intervals.
price_history = mrk_crawler.pull_coin_prices_as_models("BTC", time.time(), time.time() - 60 * 60, "1m")
print("Prices gathered. Inserting into the database...")
db.insert_prices(price_history)

