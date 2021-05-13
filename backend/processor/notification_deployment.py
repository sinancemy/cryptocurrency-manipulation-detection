from data.database import Trigger, Notification
from misc import TimeRange


class NotificationDeployer:
    def __init__(self, coins, sources):
        self.change_map = {}
        self.coins = coins
        self.sources = sources

    def _split_from_epoch(self, time_range: TimeRange) -> (TimeRange, TimeRange):
        pass

    def _calculate_coin_change(self, time_range: TimeRange) -> (float, float):
        pass

    def _calculate_source_change(self, time_range: TimeRange) -> (float, float):
        pass

    def prepare_change_map(self):
        pass

    # Returns the notification and a boolean representing if an e-mail should be sent.
    def process_trigger(self, trigger: Trigger) -> (Notification, bool):
        # Check if there are unread notifications that are associated with this trigger.
        has_unread = any(n.read == 0 for n in trigger.notifications)
        # Check if the e-mail notifications for this trigger are turned on.
        notify_email = trigger.follow.notify_email
        should_send_email = notify_email and not has_unread
        return None, should_send_email


def deploy_notifications(curr_time: int, coins, sources):
    pass
