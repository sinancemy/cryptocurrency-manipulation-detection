from dataclasses import dataclass

from data.database import db


@dataclass
class AggregatePostCount(db.Model):
    id: int
    time: int
    next_time: int
    sum: int
    smas: str
    source: str

    __tablename__ = "post_counts"
    __bind_key__ = "aggregate"
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
    sum: float
    avg: float
    source: str

    __tablename__ = "post_impacts"
    __bind_key__ = "aggregate"
    id = db.Column(db.Integer, primary_key=True)
    time = db.Column(db.Integer)
    next_time = db.Column(db.Integer)
    sum = db.Column(db.Float)
    avg = db.Column(db.Float)
    source = db.Column(db.String)


@dataclass
class StreamedAggregatePostCount(db.Model):
    id: int
    time: int
    next_time: int
    sum: int
    source: str

    __tablename__ = "streamed_post_counts"
    __bind_key__ = "aggregate"
    id = db.Column(db.Integer, primary_key=True)
    time = db.Column(db.Integer)
    next_time = db.Column(db.Integer)
    sum = db.Column(db.Integer)
    source = db.Column(db.String)