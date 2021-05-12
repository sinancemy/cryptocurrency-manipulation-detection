from dataclasses import dataclass
from data.database.db import db
from misc import TriggerTimeWindow, FollowType


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
    notifications = db.relationship("Notification", cascade="all, delete")


@dataclass
class Session(db.Model):
    id: int
    token: str
    user_id: int
    expiration: int

    __tablename__ = "sessions"
    __bind_key__ = "app"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    token = db.Column(db.String(16), nullable=False)
    expiration = db.Column(db.Integer, nullable=False)

    user = db.relationship("User")


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


@dataclass
class Trigger(db.Model):
    id: int
    follow_id: int
    time_window: TriggerTimeWindow
    threshold: int

    __tablename__ = "triggers"
    __bind_key__ = "app"
    id = db.Column(db.Integer, primary_key=True)
    follow_id = db.Column(db.Integer, db.ForeignKey("follows.id"), nullable=False)
    time_window = db.Column(db.Enum(TriggerTimeWindow), nullable=False)
    threshold = db.Column(db.Integer, nullable=False)

    follow = db.relationship("Follow")


@dataclass
class Notification(db.Model):
    id: int
    user_id: int
    content: str
    time: int
    read: bool

    __tablename__ = "notifications"
    __bind_key__ = "app"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text)
    time = db.Column(db.Integer, nullable=False)
    read = db.Column(db.Boolean, nullable=False, default=False)


@dataclass
class PasswordReset(db.Model):
    id: int
    user_id: int
    code: str

    __tablename__ = "password_resets"
    __bind_key__ = "app"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    code = db.Column(db.String)