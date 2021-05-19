import dataclasses
from dataclasses import dataclass

from misc import CoinType
from data.database.db import db


@dataclass
class StreamedPost(db.Model):
    id: int
    coin_type: CoinType
    user: str
    content: str
    source: str
    time: int

    __tablename__ = "streamed_posts"
    __bind_key__ = "stream"
    id = db.Column(db.Integer, primary_key=True)
    coin_type = db.Column(db.Enum(CoinType))
    user = db.Column(db.String)
    content = db.Column(db.Text)
    source = db.Column(db.String)
    time = db.Column(db.Integer)

    def copy(self):
        return dataclasses.replace(self)


