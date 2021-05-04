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

    # Adds the given models into the specified table.
    # Fields that are named as 'id' are discarded.
    def create(self, table, models: list, ignore=True):
        if len(models) == 0:
            return
        model_keys = list(models[0].__dict__.keys())
        model_values = list(map(lambda p: list(p.__dict__.values()), models))
        # If the models have an "id" field, we want to discard them during insertion.
        if "id" in model_keys:
            i = model_keys.index("id")
            model_keys.remove("id")
            for v in model_values:
                v.pop(i)
        insert_sql = generate_insert_with_ignore_query(table, model_keys) if ignore else \
            generate_insert_query(table, model_keys)
        # Batch insert the given posts.
        self.conn.executemany(insert_sql, model_values)
        self.conn.commit()

    # Generic deletion method.
    def delete_by(self, table, selectors: list):
        delete_sql, params = generate_delete_query(table, selectors)
        cur = self.conn.cursor()
        cur.execute(delete_sql, params)
        self.conn.commit()

    # Generic update method.
    def update_by(self, table, cols: list, vals: list, selectors: list):
        update_sql, params = generate_update_query(table, cols, vals, selectors)
        cur = self.conn.cursor()
        cur.execute(update_sql, params)
        self.conn.commit()

    # Generic reading method.
    def read_by(self, table, selectors: list, row_converter, limit=-1, order_by=None, desc=0) -> list:
        select_sql, params = generate_select_query(table, selectors, limit=limit, order_by=order_by, desc=desc)
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
                                      MatchSelector("coin_type", coin_type.value)], row_to_post)

    def read_posts_by_time_and_coin_type_and_source(self, low, high, coin_type: CoinType, source: str):
        return self.read_by("posts", [RangeSelector("time", low, high),
                                      MatchSelector("coin_type", coin_type.value),
                                      MatchSelector("source", source)], row_to_post)

    def read_prices(self):
        return self.read_by("prices", [], row_to_price)

    def read_prices_by_time(self, low, high):
        return self.read_by("prices", [RangeSelector("time", low, high)], row_to_price)

    def read_prices_by_time_and_coin_type(self, low, high, coin_type: CoinType):
        return self.read_by("prices", [RangeSelector("time", low, high),
                                       MatchSelector('coin_type', coin_type.value)], row_to_price)

    def read_prices_by_coin_type(self, coin_type: CoinType):
        return self.read_by("prices", [MatchSelector('coin_type', coin_type.value)], row_to_price)

    def read_tops(self, table_name: str, order_by: str, order_dir: str, limit: int, selectors: list, row_converter):
        sql, params = generate_top_query(table_name, order_by=order_by, order_dir=order_dir, limit=limit,
                                         selectors=selectors)
        cur = self.conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()
        return [row_converter(r) for r in rows]

    def read_grouped_tops(self, table_name: str, group_by: str, group_selector: str, limit: int, selectors: list,
                          row_converter):
        sql, params = generate_grouped_top_query(table_name, group_by=group_by, group_selector=group_selector,
                                                 limit=limit, selectors=selectors)
        cur = self.conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()
        return [row_converter(r) for r in rows]

    def read_top_sources(self, coin_type: CoinType, limit: int, row_converter) -> list:
        return self.read_grouped_tops("posts", "source", "COUNT(id)", limit,
                                      [MatchSelector("coin_type", coin_type.value)], row_converter)

    def read_top_active_users(self, coin_type: CoinType, limit: int, row_converter) -> list:
        return self.read_grouped_tops("posts", "user", "COUNT(id)", limit,
                                      [MatchSelector("coin_type", coin_type.value)], row_converter)

    def read_top_interacted_users(self, coin_type: CoinType, limit: int, row_converter) -> list:
        return self.read_grouped_tops("posts", "user", "SUM(interaction)", limit,
                                      [MatchSelector("coin_type", coin_type.value)], row_converter)

    def read_num_source_followers(self, source: str) -> int:
        sql, params = generate_select_query("followers", [MatchSelector("type", "source"),
                                                          MatchSelector("target", "*@" + source)],
                                            ["COUNT(userid)"])
        cur = self.conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()
        return rows[0][0]

    def read_num_user_followers(self, user: str, source: str) -> int:
        sql, params = generate_select_query("followers", [MatchSelector("type", "source"),
                                                          MatchSelector("target", user + "@" + source)],
                                            ["COUNT(userid)"])
        cur = self.conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()
        return rows[0][0]

    def read_num_coin_followers(self, coin: CoinType) -> int:
        sql, params = generate_select_query("followers", [MatchSelector("type", "coin"),
                                                          MatchSelector("target", coin.value)],
                                            ["COUNT(userid)"])
        cur = self.conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()
        return rows[0][0]

    def read_last_price(self, coin_type: CoinType):
        rows = self.read_tops("prices", "time", "desc", 1, [MatchSelector("coin_type", coin_type.value)], row_to_price)
        if len(rows) < 1:
            return None
        return rows[0]

    def read_users(self):
        sql = generate_select_distinct_query("posts", ["user", "source"])
        cur = self.conn.cursor()
        cur.execute(sql)
        rows = cur.fetchall()
        return [{"user": r[0], "source": r[1]} for r in rows]

    def read_num_posts_within_time(self, low, high, selectors) -> int:
        sql, params = generate_select_query("posts", [RangeSelector("time", low, high)] + selectors, ["COUNT(id)"])
        cur = self.conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()
        return rows[0][0]
