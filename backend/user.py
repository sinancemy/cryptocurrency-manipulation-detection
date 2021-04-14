from typing import Optional

from data.database import Database, MatchSelector, row_to_user, row_to_followed_coin, row_to_followed_source, User
import hashlib
import secrets


def verify_password(given: str, hash: str, salt: str) -> bool:
    return hash == hashlib.sha256(str(given + salt).encode("utf-8")).hexdigest()


# Returns hash, salt.
def new_password(password: str) -> (str, str):
    salt = secrets.token_hex(8)
    return hashlib.sha256(str(password + salt).encode("utf-8")).hexdigest(), salt


# Represents a user.
class UserInfo(object):
    def __init__(self, user: User, followed_coins: list, followed_sources: list):
        self.user = user
        self.followed_coins = followed_coins
        self.followed_sources = followed_sources

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return str(self.user.id)


# Returns false if the user already exists.
def create_user(db: Database, username: str, password: str) -> bool:
    if get_user_by_username(db, username) is not None:
        return False
    hash, salt = new_password(password)
    user = User(-1, username, hash, salt)
    # Insert into the database.
    db.create("users", [user])
    return True


def get_user_by_username(db: Database, username: str) -> Optional[UserInfo]:
    user_rows = db.read_by("users", [MatchSelector("username", username)], row_to_user)
    if len(user_rows) != 1:
        return None
    partial_user = UserInfo(user_rows[0], [], [])
    return populate_user_info(db, user_rows[0].id, partial_user)


def get_user_by_userid(db: Database, userid: str) -> Optional[UserInfo]:
    # We expect the user id to be an integer.
    try:
        userid = int(userid)
    except TypeError:
        return None
    user_rows = db.read_by("users", [MatchSelector("id", userid)], row_to_user)
    if len(user_rows) != 1:
        return None
    partial_user = UserInfo(user_rows[0], [], [])
    return populate_user_info(db, user_rows[0].id, partial_user)


def populate_user_info(db: Database, userid: int, partial_user: UserInfo):
    partial_user.followed_coins = db.read_by("followed_coins", [MatchSelector("userid", userid)], row_to_followed_coin)
    partial_user.followed_sources = db.read_by("followed_sources", [MatchSelector("userid", userid)],
                                               row_to_followed_source)
    return partial_user
