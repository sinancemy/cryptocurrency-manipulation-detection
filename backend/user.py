from typing import Optional

from data.database import Database, MatchSelector
import time
import hashlib
import secrets


def verify_password(given: str, hash: str, salt: str) -> bool:
    return hash == hashlib.sha256(str(given + salt).encode("utf-8")).hexdigest()


# Returns hash, salt.
def new_password(password: str) -> (str, str):
    salt = secrets.token_hex(8)
    return hashlib.sha256(str(password + salt).encode("utf-8")).hexdigest(), salt


# def notify(db: Database, table, selector, row_converter) -> list:
#     current_time = time.time()
#     should_notify_email = db.read_by(table, [selector, MatchSelector("notify_email", 1)], row_converter)
#     db.update_by(table, ["notification_read", "notification_time"], [0, current_time], [selector])
#     return should_notify_email
#
#
# # Batch notify all the users following the given coin in the database.
# # Returns the list of FollowedCoin entries that should receive an e-mail notification.
# def notify_coin(db: Database, coin: CoinType) -> list:
#     return notify(db, "followers", [MatchSelector("coin_type", coin.value)], row_to_followed_coin)
#
#
# # Batch notify all the sources following the given source in the database.
# # Returns the list of updated FollowedSource entries that should receive an e-mail notification.
# def notify_source(db: Database, source: str) -> list:
#     return notify(db, "followed_source", [MatchSelector("source", source)], row_to_followed_source)
