from typing import Optional

from data.database import Database, MatchSelector, row_to_user, row_to_followed_coin, row_to_followed_source, User, \
    Session, row_to_session
import time
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
    followed_coins = db.read_by("followed_coins", [MatchSelector("userid", userid)], row_to_followed_coin)
    followed_sources = db.read_by("followed_sources", [MatchSelector("userid", userid)],
                                               row_to_followed_source)
    partial_user.followed_coins = sorted(followed_coins, key=lambda x: x.coin_type)
    partial_user.followed_sources = sorted(followed_sources, key=lambda x: x.source)
    return partial_user


def new_session(db: Database, userid: int) -> str:
    # Create a new token.
    token = secrets.token_hex(64)
    # Remove the other sessions associated with the userid.
    db.delete_by("sessions", [MatchSelector("userid", userid)])
    # Add the new session.
    db.create("sessions", [Session(userid, token, int(time.time()) + 60 * 60 * 24)])
    # Return the token.
    return token


def remove_session(db: Database, token: str):
    db.delete_by("sessions", [MatchSelector("token", token)])


def check_session(db: Database, token: str) -> Optional[UserInfo]:
    sessions = db.read_by("sessions", [MatchSelector("token", token)], row_to_session)
    # If multiple sessions are associated with the same token, delete all sessions.
    if len(sessions) > 1:
        db.delete_by("sessions", [MatchSelector("token", token)])
        print("Detected multiple sessions for token", token)
        return None
    # If no sessions were found for the token, authentication is unsuccessful.
    elif len(sessions) == 0:
        return None
    session = sessions[0]
    curr_time = int(time.time())
    # Check the expiration of the session.
    if curr_time > session.expiration:
        print("Supplied expired token", token)
        db.delete_by("sessions", [MatchSelector("token", token)])
        return None
    # Otherwise, authentication is successful. Return the authenticated user.
    return get_user_by_userid(db, session.userid)
