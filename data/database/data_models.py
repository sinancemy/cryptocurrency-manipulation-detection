import dataclasses
from dataclasses import dataclass

from misc import CoinType
from data.database.db import db


@dataclass
class Post(db.Model):
    id: int
    coin_type: CoinType
    user: str
    content: str
    source: str
    interaction: int
    time: int
    unique_id: str
    impact: bytes
    avg_impact: float
    type: str

    __tablename__ = "posts"
    __bind_key__ = "data"
    id = db.Column(db.Integer, primary_key=True)
    coin_type = db.Column(db.Enum(CoinType))
    user = db.Column(db.String)
    content = db.Column(db.Text)
    source = db.Column(db.String)
    interaction = db.Column(db.Integer)
    time = db.Column(db.Integer)
    unique_id = db.Column(db.String)
    impact = db.Column(db.LargeBinary, default=b'')
    avg_impact = db.Column(db.Float, default=0.0)
    type = db.Column(db.String)

    def copy(self):
        return dataclasses.replace(self)


@dataclass
class AggregatePostCount(db.Model):
    id: int
    time: int
    next_time: int
    sum: int
    smas: str
    source: str

    __tablename__ = "aggr_post_counts"
    __bind_key__ = "data"
    id = db.Column(db.Integer, primary_key=True)
    time = db.Column(db.Integer)
    next_time = db.Column(db.Integer)
    sum = db.Column(db.Integer)
    smas = db.Column(db.Text)
    source = db.Column(db.String)


@dataclass
class AggregatePostImpact(db.Model):
    id: int
    time: int
    next_time: int
    cum: float
    avg: float
    source: str

    __tablename__ = "aggr_post_impacts"
    __bind_key__ = "data"
    id = db.Column(db.Integer, primary_key=True)
    time = db.Column(db.Integer)
    next_time = db.Column(db.Integer)
    cum = db.Column(db.Float)
    avg = db.Column(db.Float)
    source = db.Column(db.String)


@dataclass
class Price(db.Model):
    id: int
    coin_type: CoinType
    price: float
    time: int
    volume: float
    type: str

    __tablename__ = "prices"
    __bind_key__ = "data"
    id = db.Column(db.Integer, primary_key=True)
    coin_type = db.Column(db.Enum(CoinType))
    price = db.Column(db.Float)
    time = db.Column(db.Integer)
    volume = db.Column(db.Float)
    type = db.Column(db.String)


@dataclass
class CachedRange(db.Model):
    id: int
    low: int
    high: int
    type: str

    __tablename__ = "cached_ranges"
    __bind_key__ = "data"
    id = db.Column(db.Integer, primary_key=True)
    low = db.Column(db.Integer)
    high = db.Column(db.Integer)
    type = db.Column(db.String)
