from sqlalchemy import desc, func
from tqdm import tqdm

from data.database import AggregatePostCount, db, Trigger, Follow, Notification, datetime
from misc import TimeRange, TriggerTimeWindow, get_trigger_time_window_seconds, FollowType


def get_cumulatives(aggregate_model, pre_query, low, high) -> (float, float):
    # Get the first cumulative.
    start_cum = pre_query \
        .filter(aggregate_model.time <= low) \
        .filter(aggregate_model.next_time >= low) \
        .first()
    if start_cum is None:
        first_cum = db.session.query(func.min(aggregate_model.cum)).first()
        start_cum = first_cum[0]
    else:
        start_cum = start_cum.cum
    # Get the last cumulative.
    end_cum = pre_query \
        .filter(aggregate_model.time <= high) \
        .filter(aggregate_model.next_time >= high) \
        .first()
    if end_cum is None:
        last_cum = db.session.query(func.max(aggregate_model.cum)).first()
        end_cum = last_cum[0]
    else:
        end_cum = end_cum.cum
    return start_cum, end_cum


def calculate_cumulative_change_percent(aggregate_model, pre_query, closed_time_range: TimeRange) -> float:
    start, end = get_cumulatives(aggregate_model, pre_query, closed_time_range.low, closed_time_range.high)
    if start == 0:
        return float("inf")
    return ((end - start) / start) * 100


def calculate_change_map(aggregate_model, curr_time, coins, sources) -> dict:
    change_map = {}
    for time_window in TriggerTimeWindow:
        time_interval = get_trigger_time_window_seconds(time_window)
        time_range = TimeRange(curr_time, curr_time + time_interval)
        change_map_window = {}
        # Calculate for coins.
        for coin in coins:
            coin_query = db.session.query(aggregate_model).filter_by(source="coin:" + coin.value)
            change_percent = calculate_cumulative_change_percent(aggregate_model, coin_query, time_range)
            change_map_window[(FollowType.coin, coin.value)] = change_percent
        # Calculate for sources.
        for source in sources:
            source_query = db.session.query(aggregate_model).filter_by(source="source:" + source)
            change_percent = calculate_cumulative_change_percent(aggregate_model, source_query, time_range)
            change_map_window[(FollowType.source, source)] = change_percent
        change_map[time_window] = change_map_window
    return change_map


def deploy_notifications(curr_time: int, coins, sources):
    change_map = calculate_change_map(AggregatePostCount, curr_time, coins, sources)
    # trigger id => trigger
    all_affected_triggers = dict()
    for trigger_time_window, trigger_time_window_change_map in tqdm(change_map.items(),
                                                                    "Determining the affected triggers..."):
        for follow_info, change in trigger_time_window_change_map.items():
            follow_type, follow_target = follow_info
            affected_triggers = db.session.query(Trigger).join(Follow) \
                .filter(Follow.type == follow_type) \
                .filter(Follow.target == follow_target) \
                .filter(Trigger.time_window == trigger_time_window) \
                .filter(Trigger.threshold <= change)\
                .all()
            # Save the affected triggers.
            for trigger in affected_triggers:
                all_affected_triggers[trigger.id] = (change, trigger)
    new_notifications = []
    for actual_change, trigger in tqdm(all_affected_triggers.values(), "Deploying notifications..."):
        user_id = trigger.follow.user.id
        change_str = "∞" if actual_change == float("inf") else str(int(actual_change))
        notification_content = trigger.follow.target + " has increased by " + change_str + "%\n"
        notification_content += "Triggered by " + str(trigger.id)
        new_notification = Notification(user_id=user_id, content=notification_content,
                                        time=datetime.fromtimestamp(curr_time), read=False)
        new_notifications.append(new_notification)
    db.session.bulk_save_objects(new_notifications)
    db.session.commit()
    # Remove the actual change information.
    return list(map(lambda t: t[1], all_affected_triggers.values()))

