import time

from app.db_config import configure_database
from app.main_app import create_app
from backend.app_helpers import get_all_sources
from backend.processor.aggregate_post_count import create_aggregate_post_counts
from backend.processor.mail_deployment import Mailer
from backend.processor.notification_deployment import deploy_notifications
from data.collector.reddit import ArchivedRedditCrawler, RealtimeRedditCrawler
from data.collector.twitter import TwitterCrawler
from data.collector.yahoo import YahooPriceCrawler
from data.reader.datareader import DataReader

from misc import TimeRange, CoinType

# In seconds
SLEEP_INTERVAL = 60 * 60 * 24 * 60


# Collect novel data.
def start(mailer: Mailer):
    social_media_crawlers = [TwitterCrawler(), ArchivedRedditCrawler(interval=60 * 60 * 24 * 7, api_settings={'limit': 2000, 'score': '>4'}), RealtimeRedditCrawler()]
    price_crawler = YahooPriceCrawler(resolution="1h")
    data_reader = DataReader(social_media_crawlers=[], price_crawler=price_crawler)
    coin_types = [CoinType.btc, CoinType.eth, CoinType.doge]
    while True:
        # Wait until aligned with sleep_interval
        t = int(time.time())
        # while t % SLEEP_INTERVAL != 0:
        #     t = int(time.time())
        #     time.sleep(1)
        effective_time_range = TimeRange(t - SLEEP_INTERVAL + 1, t)
        print("Novel data collection initiated...")
        new_posts = []
        for c in coin_types:
            data_reader.update_coin_type(c)
            posts, _ = data_reader.read(effective_time_range, SLEEP_INTERVAL)
            # new_posts += posts
            # new_posts += posts
        # Post-processing...
        # update_impacts(new_posts)
        groups = list(filter(lambda s: s.startswith("*"), get_all_sources()))
        # create_aggregate_post_impacts(coin_types, groups, effective_time_range)
        create_aggregate_post_counts(coin_types, [], effective_time_range)
        # Deploy the web-site notifications.
        # affected_triggers = deploy_notifications(t, coin_types, groups)
        # Find the affected triggers that should be notified by e-mail.
        # mail_triggers = list(filter(lambda t: t.follow.notify_email, affected_triggers))
        # Send the appropriate e-mails...
        # mailer.deploy_mails(mail_triggers)
        time.sleep(SLEEP_INTERVAL)
        break


if __name__ == "__main__":
    app = create_app()
    configure_database(app)
    with app.app_context():
        mailer = Mailer(app)
        start(mailer)
