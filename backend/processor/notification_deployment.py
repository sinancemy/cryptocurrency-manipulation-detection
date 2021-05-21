import itertools
import time
from typing import List

from sqlalchemy import func

import misc
from backend import api_settings
from backend.processor.mail_deployment import Mailer
from data.database import Trigger, Notification, db, AggregatePostCount, StreamedAggregatePostCount
from misc import TimeRange


def percent_change(start: float, end: float) -> float:
    return float("inf") if start == 0 else 100 * (end - start) / start


class NotificationDeployer:
    def __init__(self, coins: List[misc.CoinType], sources: List[str]):
        self.post_count_change_map = {}
        self.post_impact_change_map = {}
        self.coins = coins
        self.sources = sources

    # Returns before, after
    @staticmethod
    def _split_from_epoch(time_range: TimeRange) -> (TimeRange, TimeRange):
        last_epoch = api_settings.get_last_epoch()
        if time_range.high <= last_epoch:
            return time_range, None
        if time_range.low >= last_epoch:
            return None, time_range
        before_epoch = TimeRange(time_range.low, last_epoch)
        after_epoch = TimeRange(last_epoch + 1, time_range.high)
        return before_epoch, after_epoch

    @staticmethod
    def _calculate_counts(time_range: TimeRange, aggregate_model, source) -> (int, int):
        time_field = aggregate_model.__table__.c['next_time']
        sum_field = aggregate_model.__table__.c['sum']
        start_cum = db.session.query(func.sum(sum_field)) \
            .filter_by(source=source) \
            .filter(time_field <= time_range.low) \
            .scalar()
        if start_cum is None:
            start_cum = 0
        end_cum = db.session.query(func.sum(sum_field)) \
            .filter_by(source=source) \
            .filter(time_field <= time_range.high) \
            .scalar()
        if end_cum is None:
            end_cum = 0
        return start_cum, end_cum

    @staticmethod
    def _calculate_aggregate_percent_change(time_range: TimeRange, before_epoch_aggregate_model,
                                            after_epoch_aggregate_model, source) -> float:
        before_epoch, after_epoch = NotificationDeployer._split_from_epoch(time_range)
        if before_epoch is not None:
            before_epoch_start, before_epoch_end = NotificationDeployer._calculate_counts(before_epoch,
                                                                                          before_epoch_aggregate_model,
                                                                                          source)
        if after_epoch is not None:
            after_epoch_start, after_epoch_end = NotificationDeployer._calculate_counts(after_epoch,
                                                                                        after_epoch_aggregate_model,
                                                                                        source)
        if after_epoch is None and before_epoch is not None:
            return percent_change(before_epoch_start, before_epoch_end)
        if before_epoch is None and after_epoch is not None:
            return percent_change(after_epoch_start, after_epoch_end)
        return percent_change(before_epoch_start, after_epoch_end)

    def prepare_change_map(self, before_epoch_model, after_epoch_model, curr_time):
        for time_window_str, time_window_seconds in api_settings.TRIGGER_TIME_WINDOW_TO_SECONDS.items():
            self.post_count_change_map[time_window_str] = {}
            effective_time_range = TimeRange(curr_time - time_window_seconds, curr_time)
            for aggr_source in itertools.chain(map(lambda c: "coin:" + c.value, self.coins),
                                               map(lambda s: "source:" + s, self.sources)):
                coin_change = self._calculate_aggregate_percent_change(effective_time_range, before_epoch_model,
                                                                       after_epoch_model, aggr_source)
                self.post_count_change_map[time_window_str][aggr_source] = coin_change

    # Returns the notification and a boolean representing if an e-mail should be sent, returns None if trigger isn't
    # triggered.
    def process_trigger(self, trigger: Trigger) -> (Notification, bool):
        # Lookup the relevant change in the change map.
        change = self.post_count_change_map[trigger.time_window][trigger.follow.type + ":" + trigger.follow.target]
        # If the change is above the set threshold...
        if change >= trigger.threshold:
            # Check if there are unread notifications that are associated with this trigger.
            has_unread = any(n.read == 0 for n in trigger.notifications)
            # Check if the e-mail notifications for this trigger are turned on.
            notify_email = trigger.follow.notify_email
            # Decide whether to send or not send and email.
            should_send_email = notify_email and not has_unread
            # Create notification.
            message = "%s saw a %s%% increase in the last %s" \
                      % (trigger.follow.target, "{:.2f}".format(change), trigger.time_window)
            notification = Notification(user_id=trigger.follow.user_id, trigger_id=trigger.id,
                                        content=message, time=int(time.time()), read=False)
            print("Sending a notification to user", trigger.follow.user_id)
            return notification, should_send_email
        else:
            return None, False


def deploy_notifications(curr_time: int, coins, sources, mailer: Mailer):
    d = NotificationDeployer(coins, sources)
    d.prepare_change_map(AggregatePostCount, StreamedAggregatePostCount, curr_time)
    triggers = Trigger.query.all()
    triggers_to_email = []
    for t in triggers:
        notification, should_send_email = d.process_trigger(t)
        if notification is not None:
            db.session.add(notification)
            db.session.commit()
        if should_send_email:
            triggers_to_email.append(t)
    mailer.send_trigger_mail(triggers_to_email)
