from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

SQLALCHEMY_DATABASE_URI = "sqlite:///./app.db"
SQLALCHEMY_BINDS = {
    "app": "sqlite:///./app.db",
    "data": "sqlite:///./data.db"
}


def configure_app(app):
    app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_BINDS"] = SQLALCHEMY_BINDS
    # app.config["SQLALCHEMY_ECHO"] = True
