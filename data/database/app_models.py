import enum
from datetime import datetime

from dataclasses import dataclass
from data.database.config import db


@dataclass
class User(db.Model):
    id: int
    username: str
    email: str
    password: str
    salt: str
    follows: 'Follow'
    sessions: 'Session'

    __tablename__ = "users"
    __bind_key__ = "app"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    password = db.Column(db.String, nullable=False)
    salt = db.Column(db.String(16), nullable=False)
    follows = db.relationship("Follow", backref="user_follows", cascade="all, delete", lazy=True)
    sessions = db.relationship("Session", backref="user_sessions", cascade="all, delete", lazy=True)


@dataclass
class Session(db.Model):
    id: int
    token: str
    user_id: int
    expiration: datetime

    __tablename__ = "sessions"
    __bind_key__ = "app"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    token = db.Column(db.String(16), nullable=False)
    expiration = db.Column(db.DateTime, nullable=False)

    user = db.relationship("User")


class FollowType(enum.Enum):
    coin = "coin"
    source = "source"

    def __deepcopy__(self, memo):
        return self.value


@dataclass
class Follow(db.Model):
    id: int
    user_id: int
    type: FollowType
    target: str
    notify_email: bool
    triggers: 'Trigger'

    __tablename__ = "follows"
    __bind_key__ = "app"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    type = db.Column(db.Enum(FollowType), nullable=False)
    target = db.Column(db.String, nullable=False)
    notify_email = db.Column(db.Boolean, nullable=False, default=False)
    triggers = db.relationship("Trigger", backref="follow_triggers", cascade="all, delete", lazy=True)

    user = db.relationship("User")


class TriggerTimeWindow(enum.Enum):
    one_hour = "1h"
    two_hours = "2h"
    five_hours = "5h"
    one_day = "1d"

    def __deepcopy__(self, memo):
        return self.value


@dataclass
class Trigger(db.Model):
    id: int
    follow_id: int
    time_window: TriggerTimeWindow
    threshold: int
    notifications: 'Notification'

    __tablename__ = "triggers"
    __bind_key__ = "app"
    id = db.Column(db.Integer, primary_key=True)
    follow_id = db.Column(db.Integer, db.ForeignKey("follows.id"), nullable=False)
    time_window = db.Column(db.Enum(TriggerTimeWindow), nullable=False)
    threshold = db.Column(db.Integer, nullable=False)
    notifications = db.relationship("Notification", backref="trigger_notifications", lazy=True)

    follow = db.relationship("Follow")


@dataclass
class Notification(db.Model):
    id: int
    trigger_id: int
    time: datetime
    read: bool

    __tablename__ = "notifications"
    __bind_key__ = "app"
    id = db.Column(db.Integer, primary_key=True)
    trigger_id = db.Column(db.Integer, db.ForeignKey("triggers.id"))
    time = db.Column(db.DateTime, nullable=False)
    read = db.Column(db.Boolean, nullable=False, default=False)

    trigger = db.relationship("Trigger")
