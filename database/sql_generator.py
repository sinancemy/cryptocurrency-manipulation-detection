TABLE_CREATE_QUERIES = ["""
    CREATE TABLE "posts" (
    "id"	INTEGER NOT NULL UNIQUE,
    "user"	TEXT NOT NULL,
    "content"	TEXT NOT NULL,
    "source"	TEXT NOT NULL,
    "interaction"	INTEGER DEFAULT 0,
    "time"	BLOB NOT NULL,
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
