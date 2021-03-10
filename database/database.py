import sqlite3
from database.sql_generator import *
import os

DATABASE_FILE = "database.db"


# Recreates the database from scratch.
def recreate_database():
    if os.path.exists(DATABASE_FILE):
        os.remove(DATABASE_FILE)
    conn = sqlite3.connect(DATABASE_FILE)
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

    def add_user(self, username, password):
        pass

    def check_user(self, username, given_pw):
        pass

    def get_user_followed_coins(self, username):
        pass

    def follow_coin(self, username, coin):
        pass

    def unfollow_coin(self, username, coin):
        pass

    def insert_posts(self, posts):
        insert_sql = generate_insert_with_ignore("posts", ["unique_id", "user", "content", "source", "interaction", "time"])
        # Batch insert the given posts.
        self.conn.executemany(insert_sql, map(lambda p: [p.unique_id, p.poster, p.content, p.source, p.interaction, p.time], posts))
        self.conn.commit()

    def insert_prices(self, prices):
        insert_sql = generate_insert_query("prices", ["coin", "price", "time"])
        # Batch insert the given prices.
        self.conn.executemany(insert_sql, map(lambda p: [p.coin_name, p.price, p.time], prices))
        self.conn.commit()
