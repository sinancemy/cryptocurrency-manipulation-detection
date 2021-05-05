from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

SQLALCHEMY_DATABASE_URI = "sqlite:///./app.db"
SQLALCHEMY_BINDS = {
    "app": "sqlite:///./app.db",
    "data": "sqlite:///./data.db"
}
