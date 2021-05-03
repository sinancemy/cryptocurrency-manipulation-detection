TABLE_CREATE_QUERIES = ["""
CREATE TABLE "posts" (
    "id"	INTEGER NOT NULL UNIQUE,
    "coin_type"	TEXT NOT NULL,
    "user"	TEXT NOT NULL,
    "content"	TEXT NOT NULL,
    "source"	TEXT NOT NULL,
    "interaction"	INTEGER DEFAULT 0,
    "time"	INTEGER NOT NULL,
    "unique_id"	TEXT NOT NULL UNIQUE,
    "type"	TEXT NOT NULL,
    PRIMARY KEY("id" AUTOINCREMENT)
)
""", """
    CREATE TABLE "prices" (
    "id"	INTEGER NOT NULL UNIQUE,
    "coin_type"	TEXT NOT NULL,
    "price"	REAL NOT NULL,
    "time"	INTEGER NOT NULL,
    "volume"	REAL NOT NULL,
    "type"	TEXT NOT NULL,
    PRIMARY KEY("id" AUTOINCREMENT)
)
""", """
CREATE TABLE "cached_ranges" (
    "id"	INTEGER NOT NULL UNIQUE,
    "low"	INTEGER NOT NULL,
    "high"	INTEGER NOT NULL,
    "type"	TEXT NOT NULL,
    PRIMARY KEY("id" AUTOINCREMENT)
)
""", """
CREATE TABLE "users" (
    "id"	INTEGER NOT NULL UNIQUE,
    "username"	TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    PRIMARY KEY("id" AUTOINCREMENT)
)
""", """
CREATE TABLE "followed_coins" (
    "id"	INTEGER NOT NULL UNIQUE,
    "userid" INTEGER NOT NULL,
    "coin_type" TEXT NOT NULL,
    "notify_email" INTEGER NOT NULL DEFAULT 0,
    "notification_read" INTEGER NOT NULL DEFAULT 1,
    "notification_time" INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY("id" AUTOINCREMENT)
)
""", """
CREATE TABLE "followed_sources" (
    "id"	INTEGER NOT NULL UNIQUE,
    "userid" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "notify_email" INTEGER NOT NULL DEFAULT 0,
    "notification_read" INTEGER NOT NULL DEFAULT 1,
    "notification_time" INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY("id" AUTOINCREMENT)
)
""", """
CREATE TABLE "sessions" (
    "id"	INTEGER NOT NULL UNIQUE,
    "userid" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiration" INTEGER NOT NULL,
    PRIMARY KEY("id" AUTOINCREMENT)
)"""]


class RangeSelector:
    def __init__(self, col, low, high, closed=True):
        self.col = col
        self.low = low
        self.high = high
        self.closed = closed


class MatchSelector:
    def __init__(self, col, needle):
        self.col = col
        self.needle = needle


# Custom selector for sources. Not very elegant.
class SourceSelector:
    def __init__(self, sources: list):
        self.sources = sources


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


def create_conditionals(selectors: list) -> (str, list):
    params = []
    conds = []
    sql = ""
    for (i, selector) in enumerate(selectors):
        if isinstance(selector, RangeSelector):
            inner_conds = []
            inner_params = []
            gt = ">=" if selector.closed else ">"
            st = "<=" if selector.closed else "<"
            if selector.high is not None:
                inner_conds.append("(" + selector.col + (" %s ?)" % st))
                inner_params.append(selector.high)
            if selector.low is not None:
                inner_conds.append("(" + selector.col + (" %s ?)" % gt))
                inner_params.append(selector.low)
            cond = "(" + (" AND ".join(inner_conds)) + ")"
            conds.append(cond)
            params += inner_params
        elif isinstance(selector, MatchSelector):
            cond = "(" + selector.col + " = ?)"
            conds.append(cond)
            params += [selector.needle]
        # Handle the custom source selector.
        elif isinstance(selector, SourceSelector):
            inner_conds = []
            inner_params = []
            for source in selector.sources:
                source_parts = source.split("@")
                if source_parts[0] == "*":
                    inner_conds.append("(source = ?)")
                    inner_params.append(source_parts[1])
                else:
                    inner_conds.append("(user = ? AND source = ?)")
                    inner_params.append(source_parts[0])
                    inner_params.append(source_parts[1])
            conds.append("(" + (" OR ".join(inner_conds)) + ")")
            params += inner_params

    if len(conds) > 0:
        sql = "WHERE " + " AND ".join(conds)
    return sql, params


# Creates a SELECT query with given predicates in the form of selector objects.
def generate_select_query(table_name, selectors: list, cols=None, limit=-1, order_by=None, desc=0) -> (str, list):
    if cols is None:
        cols = ['*']
    sql = "SELECT " + ",".join(cols) + " FROM " + table_name
    cond_sql, cond_params = create_conditionals(selectors)
    sql += " " + cond_sql
    if order_by is not None:
        # WARNING! Possible SQL injection vector ahead.
        sql += " ORDER BY " + order_by + " " + ("ASC" if desc == 0 else "DESC")
    if limit > 0:
        sql += " LIMIT ?"
        cond_params.append(limit)
    return sql, cond_params


def generate_select_distinct_query(table_name: str, cols: list) -> str:
    return "SELECT DISTINCT " + ",".join(cols) + " FROM " + table_name


# Creates a DELETE query with given predicates in the form of selector objects.
def generate_delete_query(table_name, selectors: list):
    sql = "DELETE FROM " + table_name
    cond_sql, cond_params = create_conditionals(selectors)
    sql += " " + cond_sql
    return sql, cond_params


def generate_update_query(table_name, cols: list, vals: list, selectors: list):
    sql = "UPDATE " + table_name + " SET "
    sql += ",".join((" = ".join([col, "?"]) for col in cols))
    cond_sql, cond_params = create_conditionals(selectors)
    sql += " " + cond_sql
    params = vals + cond_params
    return sql, params


def generate_top_query(table_name, order_by, order_dir: str, limit: int, selectors: list):
    sql = "SELECT * FROM " + table_name
    cond_sql, cond_params = create_conditionals(selectors)
    sql += " " + cond_sql
    sql += " ORDER BY " + order_by + " " + order_dir
    sql += " LIMIT " + str(limit)
    return sql, cond_params


def generate_grouped_top_query(table_name, group_by, group_selector: str, limit: int, selectors: list):
    sql = "SELECT " + group_selector + ",* FROM " + table_name
    cond_sql, cond_params = create_conditionals(selectors)
    sql += " " + cond_sql
    sql += " GROUP BY " + group_by
    sql += " ORDER BY " + group_selector + " DESC"
    sql += " LIMIT " + str(limit)
    return sql, cond_params
