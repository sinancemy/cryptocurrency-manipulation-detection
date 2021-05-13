import functools

from psaw import PushshiftAPI

from data.collector import Collector
from data.collector.reddit.config import COIN_SUBREDDITS, calculate_interaction_score
from data.database import Post
from misc import CoinType, TimeRange


class ArchivedRedditCrawler(Collector):

    def __init__(self, interval, api_settings, coin: CoinType = CoinType.btc, collect_comments=False):
        super().__init__(coin=coin, api_settings=api_settings, interval=interval, collect_comments=collect_comments)
        self.api = PushshiftAPI()

    @staticmethod
    def get_all_sources() -> list:
        return ["*@reddit/" + s for s in functools.reduce(list.__add__, COIN_SUBREDDITS.values())]

    def collect(self, time_range: TimeRange) -> iter:
        print("ArchivedRedditCrawler: Initiated collection within", time_range)
        for t in range(time_range.low, time_range.high + 1, self.settings.interval):
            tr = TimeRange(t, min(t + self.settings.interval, time_range.high))
            print("ArchivedRedditCrawler: Collecting within", tr)
            for subreddit in COIN_SUBREDDITS[self.settings.coin.value]:
                sbm = self.api.search_submissions(subreddit=subreddit, before=tr.high, after=tr.low,
                                                  **self.settings.api_settings)
                for p in sbm:
                    content = p.title + (" " + p.selftext if hasattr(p, 'selftext') else "")
                    yield Post(coin_type=self.settings.coin, user=p.author, content=content,
                               source="reddit/" + subreddit.lower(),
                               interaction=calculate_interaction_score(p.num_comments, p.score), time=p.created_utc,
                               unique_id="rs" + p.id)
                # Skip collecting the comments.
                if not self.settings.collect_comments:
                    continue
                cmt = self.api.search_comments(subreddit=subreddit, before=tr.high, after=tr.low,
                                               **self.settings.api_settings)
                for p in cmt:
                    yield Post(coin_type=self.settings.coin, user=p.author, content=p.body,
                               source="reddit/" + subreddit.lower(),
                               interaction=calculate_interaction_score(0, p.score), time=p.created_utc,
                               unique_id="rc" + p.id)