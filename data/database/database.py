import sqlite3
from data.database.sql_generator import *
from data.database.models import *
import os

DATABASE_FILE = "/Users/utkn/PycharmProjects/cryptocurrency-manipulation-detection/database.db"


# Recreates the database from scratch.
def recreate_database():
    if os.path.exists(DATABASE_FILE):
        os.remove(DATABASE_FILE)
    conn = sqlite3.connect(DATABASE_FILE)
    # Create all the tables.
    for q in TABLE_CREATE_QUERIES:
        conn.execute(q)
    conn.commit()
    conn.close()


# Converts a row from 'posts' table into a Post.
def row_to_post(r):
    return Post(CoinType(r[1]), r[2], r[3], r[4], r[5], r[6], r[7])


# Converts a row from 'prices' table into a MarketPrice
def row_to_price(r):
    return MarketPrice(CoinType(r[1]), r[2], r[3], r[4])


class Database(object):
    conn = None

    def __init__(self):
        try:
            self.conn = sqlite3.connect(DATABASE_FILE)
        except Exception as e:
            print("Could not connect to the database", e)

    def create_posts(self, posts):
        insert_sql = generate_insert_with_ignore_query("posts",
                                                       ["coin_type", "user", "content", "source", "interaction",
                                                        "time", "unique_id"])
        # Batch insert the given posts.
        self.conn.executemany(insert_sql,
                              map(lambda p: [p.coin_type.value, p.user, p.content, p.source, p.interaction,
                                             p.time, p.unique_id], posts))
        self.conn.commit()

    def create_prices(self, prices):
        insert_sql = generate_insert_query("prices", ["coin_type", "price", "time", "volume"])
        # Batch insert the given prices.
        self.conn.executemany(insert_sql, map(lambda p: [p.coin_type.value, p.price, p.time, p.volume], prices))
        self.conn.commit()

    # Generic reading method.
    def read_by(self, table, selectors, row_converter):
        select_sql = generate_select_query(table, selectors)
        cur = self.conn.cursor()
        cur.execute(select_sql)
        rows = cur.fetchall()
        # Convert using the given converter.
        return [row_converter(r) for r in rows]

    def read_posts(self):
        return self.read_by("posts", [], row_to_post)

    def read_posts_by_user(self, user):
        return self.read_by("posts", [MatchSelector("user", "'" + user + "'")], row_to_post)

    def read_posts_by_source(self, source):
        return self.read_by("posts", [MatchSelector("source", "'" + source + "'")], row_to_post)

    def read_posts_by_interaction(self, low, high):
        return self.read_by("posts", [RangeSelector("interaction", low, high)], row_to_post)

    def read_posts_by_time(self, low, high):
        return self.read_by("posts", [RangeSelector("time", low, high)], row_to_post)

    def read_prices(self):
        return self.read_by("prices", [], row_to_price)

    def read_prices_by_time(self, low, high):
        return self.read_by("prices", [RangeSelector("time", low, high)], row_to_price)
