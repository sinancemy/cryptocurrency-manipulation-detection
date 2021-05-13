import atexit
import time

import requests
from apscheduler.schedulers.background import BackgroundScheduler

# In seconds.
STREAM_UPDATE_INTERVAL = 40
POST_UPDATE_INTERVAL = 60 * 60
PRICE_COLLECT_INTERVAL = 60
POST_COLLECT_INTERVAL = 60 * 60


def collect_prices():
    print("Collecting prices")
    curr_time = int(time.time())
    requests.post("http://127.0.0.1:5000/update/collect_prices", data={"time": curr_time})
    print("Collected prices")


def collect_posts():
    print("Collecting posts")
    curr_time = int(time.time())
    requests.post("http://127.0.0.1:5000/update/collect_posts", data={"time": curr_time})
    print("Collected posts")


def update_posts():
    print("Updating posts")
    curr_time = int(time.time())
    requests.post("http://127.0.0.1:5000/update/posts", data={"time": curr_time})
    print("Updated posts")


def update_stream():
    print("Updating stream")
    curr_time = int(time.time())
    requests.post("http://127.0.0.1:5000/update/stream", data={"time": curr_time})
    print("Updated stream")


if __name__ == "__main__":
    cron = BackgroundScheduler(daemon=True)
    cron.add_job(update_stream, "interval", seconds=STREAM_UPDATE_INTERVAL)
    cron.add_job(collect_prices, "interval", seconds=PRICE_COLLECT_INTERVAL)
    # cron.add_job(update_posts, "interval", seconds=POST_UPDATE_TIME)
    cron.start()
    atexit.register(lambda: cron.shutdown())
    t = input("Scheduled updates. Press any key to exit.")
