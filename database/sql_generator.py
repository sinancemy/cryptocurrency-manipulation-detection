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


def generate_insert_query(table_name, cols):
    cols_sql = "(" + ",".join(cols) + ")"
    vals_sql = "(" + ",".join(["?"] * len(cols)) + ")"
    return "INSERT INTO " + table_name + cols_sql + " VALUES " + vals_sql


# Should discard duplicate posts during batch insertion.
def generate_insert_with_ignore(table_name, cols):
    cols_sql = "(" + ",".join(cols) + ")"
    vals_sql = "(" + ",".join(["?"] * len(cols)) + ")"
    return "INSERT OR IGNORE INTO " + table_name + cols_sql + " VALUES " + vals_sql


def generate_select_range_query(table_name, col, low, high):
    return "SELECT * FROM {0} WHERE {1} > {2} AND {1} < {3}".format(table_name, col, low, high)
