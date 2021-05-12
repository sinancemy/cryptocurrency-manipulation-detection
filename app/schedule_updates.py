import atexit
import time

import requests
from apscheduler.schedulers.background import BackgroundScheduler

# In seconds.
STREAM_UPDATE_TIME = 10
PRICE_UPDATE_TIME = 10
POST_UPDATE_TIME = 60 * 60


def update_stream():
    print("Updating stream")
    curr_time = int(time.time())
    requests.post("http://127.0.0.1:5000/update/stream", data={"time": curr_time})
    print("Updated stream")


def update_prices():
    print("Updating prices")
    curr_time = int(time.time())
    requests.post("http://127.0.0.1:5000/update/prices", data={"time": curr_time})
    print("Updated prices")


def update_posts():
    print("Updating posts")
    curr_time = int(time.time())
    requests.post("http://127.0.0.1:5000/update/posts", data={"time": curr_time})
    print("Updated posts")


if __name__ == "__main__":
    cron = BackgroundScheduler(daemon=True)
    cron.add_job(update_stream, "interval", seconds=STREAM_UPDATE_TIME)
    cron.add_job(update_prices, "interval", seconds=PRICE_UPDATE_TIME)
    # cron.add_job(update_posts, "interval", seconds=POST_UPDATE_TIME)
    cron.start()
    atexit.register(lambda: cron.shutdown())
    t = input("Scheduled updates. Press any key to exit.")
