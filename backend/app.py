from flask import Flask, request, jsonify, make_response
import time

from flask_login import LoginManager, login_user, logout_user

import misc
from data.database import Database
from data.database.user import get_user_by_userid, get_user_by_username
from json_helpers import *

app = Flask(__name__)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True

login_manager = LoginManager(app)


@login_manager.user_loader
def load_user(user_id):
    # Connect to the database.
    db = Database()
    # Load the user with the user id.
    return get_user_by_userid(db, user_id)


def get_api_args():
    start = request.args.get("start", type=int, default=-1)
    if start < 0:
        raise ValueError("start parameter is invalid")
    coin_type = request.args.get("type", type=str, default=None)
    if coin_type is None:
        raise ValueError("coin type is invalid")
    try:
        coin_type = misc.CoinType(coin_type)
    except TypeError:
        raise ValueError("coin type is invalid")
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
    end = request.args.get("end", type=int, default=int(time.time()))
    # Connect to the database
    db = Database()
    prices = db.read_prices_by_time_and_coin_type(start, end, coin_type)
    return jsonify([price_to_dict(p) for p in prices])


@app.route("/user/login")
def login():
    username = request.form.get("username", default="")
    password = request.form.get("password", default="")
    if username == "" or password == "":
        return "please provide credentials"
    db = Database()
    user = get_user_by_username(db, username)
    if user is None:
        return "invalid credentials"
    login_user(user)
    return jsonify(user.__dict__)


@app.route("/user/logout")
def logout():
    logout_user()
    return "ok"


@app.route("/user/followed_coins")
def get_followed_coins():
    user = request.args.get("username")


if __name__ == "__main__":
    app.run()
