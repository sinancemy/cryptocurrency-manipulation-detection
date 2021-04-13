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


class Database(object):
    conn = None

    def __init__(self):
        try:
            self.conn = sqlite3.connect(DATABASE_FILE)
        except Exception as e:
            print("Could not connect to the database", e)

    def create(self, table, models: list, ignore=True):
        if len(models) == 0:
            return
        model_keys = list(models[0].__dict__.keys())
        model_values = list(map(lambda p: list(p.__dict__.values()), models))
        insert_sql = generate_insert_with_ignore_query(table, model_keys) if ignore else \
            generate_insert_query(table, models[0].__dict__.keys())
        # Batch insert the given posts.
        self.conn.executemany(insert_sql, model_values)
        self.conn.commit()

    # Generic reading method.
    def read_by(self, table, selectors, row_converter):
        select_sql, params = generate_select_query(table, selectors)
        cur = self.conn.cursor()
        cur.execute(select_sql, params)
        rows = cur.fetchall()
        # Convert using the given converter.
        return [row_converter(r) for r in rows]

    def read_cached_ranges_by_type(self, range_type):
        return self.read_by("cached_ranges", [MatchSelector("type", range_type)], row_to_cached_range)

    def read_posts(self):
        return self.read_by("posts", [], row_to_post)

    def read_posts_by_user(self, user):
        return self.read_by("posts", [MatchSelector("user", user)], row_to_post)

    def read_posts_by_source(self, source):
        return self.read_by("posts", [MatchSelector("source", source)], row_to_post)

    def read_posts_by_interaction(self, low, high):
        return self.read_by("posts", [RangeSelector("interaction", low, high)], row_to_post)

    def read_posts_by_time(self, low, high):
        return self.read_by("posts", [RangeSelector("time", low, high)], row_to_post)

    def read_posts_by_time_and_coin_type(self, low, high, coin_type: CoinType):
        return self.read_by("posts", [RangeSelector("time", low, high),
                                      MatchSelector('coin_type', coin_type.value)], row_to_post)

    def read_prices(self):
        return self.read_by("prices", [], row_to_price)

    def read_prices_by_time(self, low, high):
        return self.read_by("prices", [RangeSelector("time", low, high)], row_to_price)

    def read_prices_by_time_and_coin_type(self, low, high, coin_type: CoinType):
        return self.read_by("prices", [RangeSelector("time", low, high),
                                       MatchSelector('coin_type', coin_type.value)], row_to_price)

    def read_prices_by_coin_type(self, coin_type: CoinType):
        return self.read_by("prices", [MatchSelector('coin_type', coin_type.value)], row_to_price)
