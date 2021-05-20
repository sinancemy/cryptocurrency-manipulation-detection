import functools

import praw
from praw.models import MoreComments

from data.collector import Collector
from data.collector.reddit.config import COIN_SUBREDDITS, CLIENT_ID, CLIENT_SECRET, USER_AGENT, \
    DEFAULT_PRAW_SUBMISSION_LIMIT, calculate_interaction_score
from data.database import Post
from misc import CoinType, TimeRange, time_to_str


class RealtimeRedditCrawler(Collector):

    def __init__(self, coin: CoinType = CoinType.btc, limit: int = DEFAULT_PRAW_SUBMISSION_LIMIT,
                 collect_comments=False):
        super().__init__(coin=coin, limit=limit, collect_comments=collect_comments)
        self.spider = praw.Reddit(client_id=CLIENT_ID, client_secret=CLIENT_SECRET,
                                  user_agent=USER_AGENT)

    @staticmethod
    def get_all_sources() -> list:
        return ["*@reddit/" + s for s in functools.reduce(list.__add__, COIN_SUBREDDITS.values())]

    def collect(self, time_range: TimeRange) -> list:
        print("RealtimeRedditCrawler: Initiated collection within", time_range, "with coin", str(self.settings.coin))
        posts = []
        for subreddit in COIN_SUBREDDITS[self.settings.coin]:
            posts += self.collect_posts_from_subreddit(subreddit, self.settings.coin, time_range, self.settings.limit)
        return posts

    def collect_posts_from_subreddit(self, subreddit: str, coin: CoinType, time_range: TimeRange, limit: int):
        print("RealtimeRedditCrawler:", "Collecting from", subreddit, "with time range", time_range)
        posts = []
        coin_subreddit = self.spider.subreddit(subreddit)
        for submission in coin_subreddit.new(limit=limit):
            created_time = int(submission.created_utc)
            if time_range.is_higher(created_time):
                continue
            if time_range.is_lower(created_time):
                break
            print("RealtimeRedditCrawler:", "Found post", submission.title, "with time", time_to_str(created_time))
            interaction_score = calculate_interaction_score(submission.num_comments, submission.score)
            subreddit_source = "reddit/" + submission.subreddit.display_name
            # Concatenate the title and the contents of the post.
            submission_text = submission.title + submission.selftext
            submission_model = Post(unique_id="rs" + submission.id,
                                    user=(submission.author.name if submission.author is not None else "deleted"),
                                    content=submission_text, interaction=interaction_score, source=subreddit_source.lower(),
                                    time=created_time, coin_type=coin)
            posts.append(submission_model)
            submission = self.spider.submission(id=submission.id)
            # Expand the comments.
            submission.comments.replace_more(limit=3)
            if not self.settings.collect_comments:
                continue
            # Iterate over all the comments.
            for top_comment in submission.comments.list():
                if isinstance(top_comment, MoreComments):
                    continue
                # Discard the comments with no content and deleted comments.
                if top_comment.body is None or top_comment.author is None or top_comment.body.strip() == '':
                    continue
                comment_interaction_score = calculate_interaction_score(len(top_comment.replies), top_comment.score)
                comment_model = Post(unique_id="rc" + top_comment.id,
                                     user=(top_comment.author.name if top_comment.author is not None else "deleted"),
                                     content=top_comment.body, interaction=comment_interaction_score,
                                     source=subreddit_source.lower(), time=top_comment.created_utc, coin_type=coin)
                posts.append(comment_model)
        return posts