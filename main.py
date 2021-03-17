from database.database import Database, recreate_database
import data.crawlers.reddit as rd_crawler
import data.crawlers.twitter as tw_crawler
import data.market as mrk_crawler
import time

print("Recreating the database...")
#recreate_database()

print("Connecting to the database...")

db = Database()

for p in db.read_posts_by_interaction(100, 200):
    print(p.poster, p.interaction)

print("Gathering from Reddit...")
reddit_posts = rd_crawler.get_reddit_posts_as_models(limit=10)
print("Reddit posts gathered. Inserting into the database...")
db.create_posts(reddit_posts)
print("Gathering from Twitter...")
tweets = tw_crawler.get_tweets("BTC")
print("Tweets gathered. Inserting into the database...")
db.create_posts(tweets)
print("Gathering price information...")
# Gather bitcoin price information for the last 1 hour with 1 minute intervals.
price_history = mrk_crawler.pull_coin_prices_as_models("BTC", time.time(), time.time() - 60 * 60, "1m")
print("Prices gathered. Inserting into the database...")
db.create_prices(price_history)



