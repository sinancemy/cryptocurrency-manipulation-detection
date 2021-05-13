from dataclasses import dataclass
from typing import List

from data.database.db import db
from misc import FollowType


@dataclass
class User(db.Model):
    id: int
    username: str
    email: str
    password: str
    salt: str
    follows: List['Follow']
    sessions: List['Session']

    __tablename__ = "users"
    __bind_key__ = "app"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    password = db.Column(db.String, nullable=False)
    salt = db.Column(db.String(16), nullable=False)
    follows = db.relationship("Follow", back_populates="user", cascade="all, delete", lazy=True)
    sessions = db.relationship("Session", back_populates="user", cascade="all, delete", lazy=True)
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

    user = db.relationship("User", back_populates="sessions")


@dataclass
class Follow(db.Model):
    id: int
    user_id: int
    type: FollowType
    target: str
    notify_email: bool
    triggers: List['Trigger']

    __tablename__ = "follows"
    __bind_key__ = "app"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    type = db.Column(db.Enum(FollowType), nullable=False)
    target = db.Column(db.String, nullable=False)
    notify_email = db.Column(db.Boolean, nullable=False, default=False)
    triggers = db.relationship("Trigger", back_populates="follow", cascade="all, delete", lazy=True)

    user = db.relationship("User", back_populates="follows")


@dataclass
class Trigger(db.Model):
    id: int
    follow_id: int
    time_window: str
    threshold: int
    notifications: List['Notification']

    __tablename__ = "triggers"
    __bind_key__ = "app"
    id = db.Column(db.Integer, primary_key=True)
    follow_id = db.Column(db.Integer, db.ForeignKey("follows.id"), nullable=False)
    time_window = db.Column(db.String, nullable=False)
    threshold = db.Column(db.Integer, nullable=False)
    notifications = db.relationship("Notification", back_populates='trigger', cascade="all, delete", lazy=True)

    follow = db.relationship("Follow", back_populates='triggers')


@dataclass
class Notification(db.Model):
    id: int
    user_id: int
    trigger_id: int
    content: str
    time: int
    read: bool

    __tablename__ = "notifications"
    __bind_key__ = "app"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    trigger_id = db.Column(db.Integer, db.ForeignKey("triggers.id"), nullable=True)
    content = db.Column(db.Text)
    time = db.Column(db.Integer, nullable=False)
    read = db.Column(db.Boolean, nullable=False, default=False)

    trigger = db.relationship("Trigger", back_populates="notifications")


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
