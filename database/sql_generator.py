TABLE_CREATE_QUERIES = ["""
    CREATE TABLE "posts" (
    "id"	INTEGER NOT NULL UNIQUE,
    "user"	TEXT NOT NULL,
    "content"	TEXT NOT NULL,
    "source"	TEXT NOT NULL,
    "interaction"	INTEGER DEFAULT 0,
    "time"	BLOB NOT NULL,
    "unique_id"	TEXT NOT NULL UNIQUE,
    PRIMARY KEY("id" AUTOINCREMENT)
    )
""", """
    CREATE TABLE "prices" (
    "id"	INTEGER NOT NULL UNIQUE,
    "coin"	TEXT NOT NULL,
    "price"	REAL NOT NULL,
    "time"	BLOB NOT NULL,
    PRIMARY KEY("id" AUTOINCREMENT)
    )
"""]


class RangeSelector:
    def __init__(self, col, low, high):
        self.col = col
        self.low = low
        self.high = high


class MatchSelector:
    def __init__(self, col, needle):
        self.col = col
        self.needle = needle


# Creates an INSERT query.
def generate_insert_query(table_name, cols):
    cols_sql = "(" + ",".join(cols) + ")"
    vals_sql = "(" + ",".join(["?"] * len(cols)) + ")"
    return "INSERT INTO " + table_name + cols_sql + " VALUES " + vals_sql


# Creates an INSERT query.
# Should ignore errors during batch insertion.
def generate_insert_with_ignore_query(table_name, cols):
    cols_sql = "(" + ",".join(cols) + ")"
    vals_sql = "(" + ",".join(["?"] * len(cols)) + ")"
    return "INSERT OR IGNORE INTO " + table_name + cols_sql + " VALUES " + vals_sql


# Creates a SELECT query with given predicates in the form of selector objects.
def generate_select_query(table_name, selectors):
    sql = "SELECT * FROM " + table_name
    conds = []
    for selector in selectors:
        if isinstance(selector, RangeSelector):
            cond = selector.col + "<=" + str(selector.high) + " AND " + selector.col + ">=" + str(selector.low)
            conds.append(cond)
        elif isinstance(selector, MatchSelector):
            cond = selector.col + "=" + selector.needle
            conds.append(cond)
    if len(conds) > 0:
        sql += " WHERE " + " AND ".join(conds)
    return sql
