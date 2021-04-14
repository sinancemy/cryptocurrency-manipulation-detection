from flask import Flask, request, jsonify
import time

from flask_login import LoginManager, login_user, logout_user, login_required, current_user

import misc
from data.database import Database, recreate_database
from backend.user import get_user_by_userid, get_user_by_username, verify_password, create_user
from json_helpers import *

app = Flask(__name__)
app.secret_key = b'f&#Uj**pF(G6R5O'
app.config["JSONIFY_PRETTYPRINT_REGULAR"] = True

login_manager = LoginManager(app)


@login_manager.user_loader
def load_user(user_id):
    # Connect to the database.
    db = Database()
    # Load the user with the user id.
    return get_user_by_userid(db, user_id)


def get_coin_type_arg() -> misc.CoinType:
    coin_type = request.args.get("type", type=str, default=None)
    if coin_type is None:
        raise ValueError("coin type is invalid")
    try:
        coin_type = misc.CoinType(coin_type)
    except TypeError:
        raise ValueError("coin type is invalid")
    return coin_type


def get_api_args():
    start = request.args.get("start", type=int, default=-1)
    if start < 0:
        raise ValueError("start parameter is invalid")
    coin_type = get_coin_type_arg()
    end = request.args.get("end", type=int, default=int(time.time()))
    return start, end, coin_type


@app.route("/api/posts")
def get_posts():
    try:
        start, end, coin_type = get_api_args()
    except ValueError as err:
        return err
    # Connect to the database
    db = Database()
    posts = db.read_posts_by_time_and_coin_type(start, end, coin_type)
    return jsonify([post_to_dict(p) for p in posts])


@app.route("/api/prices")
def get_prices():
    try:
        start, end, coin_type = get_api_args()
    except ValueError as err:
        return err
    # Connect to the database
    db = Database()
    prices = db.read_prices_by_time_and_coin_type(start, end, coin_type)
    return jsonify([price_to_dict(p) for p in prices])


@app.route("/user/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return "bu bir get"
    username = request.form.get("username", default="")
    password = request.form.get("password", default="")
    if username == "" or password == "":
        return "please provide credentials"
    db = Database()
    user = get_user_by_username(db, username)
    # Check the existence of the user.
    if user is None:
        return "invalid credentials"
    # Check the password.
    if not verify_password(password, user.user.password, user.user.salt):
        return "invalid credentials"
    login_user(user)
    return jsonify(dictify(user))


@app.route("/user/register", methods=["POST"])
def register():
    username = request.form.get("username", default="")
    password = request.form.get("password", default="")
    if username == "" or password == "":
        return "please provide credentials"
    db = Database()
    success = create_user(db, username, password)
    if not success:
        return "user already exists"
    return "ok"


@app.route("/user/logout")
def logout():
    logout_user()
    return "ok"


@app.route("/user/info")
@login_required
def get_followed_coins():
    return jsonify(dictify(current_user))


@app.route("/user/follow_coin")
@login_required
def follow_coin():
    try:
        coin_type = get_coin_type_arg()
    except ValueError as err:
        return err
    db = Database()
    # current_user.followed_coins
    # db.create("followed_coins", [])
    return "ok"


if __name__ == "__main__":
    recreate_database()
    app.run()
