import time
from typing import Optional

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user

import misc
from data.database import Database, recreate_database, MatchSelector, row_to_post, RangeSelector
from backend.user import get_user_by_userid, get_user_by_username, verify_password, create_user
from json_helpers import *

app = Flask(__name__)
app.secret_key = b'f&#Uj**pF(G6R5O'
app.config["JSONIFY_PRETTYPRINT_REGULAR"] = True
app.config["CORS_SUPPORTS_CREDENTIALS"] = True

CORS(app)

login_manager = LoginManager(app)


@login_manager.user_loader
def load_user(user_id):
    # Connect to the database.
    db = Database()
    # Load the user with the user id.
    return get_user_by_userid(db, user_id)


def get_coin_type_arg(required: bool = False) -> Optional[misc.CoinType]:
    coin_type = request.args.get("type", type=str, default=None)
    if coin_type is None:
        if not required:
            return None
        raise ValueError("coin type is invalid")
    try:
        coin_type = misc.CoinType(coin_type)
    except TypeError:
        raise ValueError("coin type is invalid")
    return coin_type


@app.route("/api/posts")
def get_posts():
    start = request.args.get("start", type=int, default=0)
    end = request.args.get("end", type=int, default=int(time.time()))    # Connect to the database
    try:
        coin_type = get_coin_type_arg(required=False)
    except ValueError as err:
        return jsonify({"error": str(err)})
    selectors = [RangeSelector("time", start, end)]
    source = request.args.get("source", type=str, default=None)
    user = request.args.get("user", type=str, default=None)
    if coin_type is not None:
        selectors.append(MatchSelector("coin_type", coin_type.value))
    if source is not None:
        selectors.append(MatchSelector("source", source))
    if user is not None:
        selectors.append(MatchSelector("user", user))
    # Connect to the database
    db = Database()
    posts = db.read_by("posts", selectors, row_to_post)
    # Sort by time.
    posts = sorted(posts, key=lambda p: p.time, reverse=True)
    return jsonify([post_to_dict(p) for p in posts])


@app.route("/api/prices")
def get_prices():
    start = request.args.get("start", type=int, default=0)
    end = request.args.get("end", type=int, default=int(time.time()))
    try:
        coin_type = get_coin_type_arg(required=False)
    except ValueError as err:
        return jsonify({"error": str(err)})
    # Connect to the database
    db = Database()
    prices = db.read_prices_by_time_and_coin_type(start, end, coin_type)
    # Sort by time.
    prices = sorted(prices, key=lambda p: p.time, reverse=True)
    return jsonify([price_to_dict(p) for p in prices])


@app.route("/api/coin_list")
def get_coin_list():
    coin_types = []
    for coin_type in misc.CoinType:
        coin_types.append({"name": coin_type,
                           "image": "https://www.dhresource.com/0x0/f2/albu/g9/M00/27/85/rBVaVVxO822ACwv4AALYau1h4a8355.jpg/500pcs-30mm-diameter-bitcoin-logo-label-sticker.jpg"})
    return jsonify(coin_types)


@app.route("/user/login", methods=["POST"])
def login():
    username = request.form.get("username", default="")
    password = request.form.get("password", default="")
    if username == "" or password == "":
        return jsonify({"result": "error", "error_msg": "Please provide credentials."})
    db = Database()
    user = get_user_by_username(db, username)
    # Check the existence of the user.
    if user is None:
        return jsonify({"result": "error", "error_msg": "Invalid credentials."})
    # Check the password.
    if not verify_password(password, user.user.password, user.user.salt):
        return jsonify({"result": "error", "error_msg": "Invalid credentials."})
    login_user(user)
    userdict = dictify(user)
    return jsonify({"result": "ok", "user": userdict})


@app.route("/user/register", methods=["POST"])
def register():
    username = request.form.get("username", default="")
    password = request.form.get("password", default="")
    if username == "" or password == "":
        return jsonify({"result": "error", "error_msg": "Please provide credentials."})
    db = Database()
    success = create_user(db, username, password)
    if not success:
        return jsonify({"result": "error", "error_msg": "User already exists."})
    return jsonify({"result": "ok"})


@app.route("/user/logged_in")
def logged_in():
    return jsonify({"logged_in": current_user.is_authenticated})


@app.route("/user/logout")
def logout():
    logout_user()
    return jsonify({"status": "ok"})


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
    return jsonify({"status": "ok"})


@app.route("/user/follow_source")
@login_required
def follow_source():
    pass


if __name__ == "__main__":
    # recreate_database()
    app.run()
