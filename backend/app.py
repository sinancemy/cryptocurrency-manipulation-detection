import time
from typing import Optional

from flask import Flask, request, jsonify
from flask_cors import CORS

import misc
from analysis.interface import Predictor
from data.collector.sources import get_all_sources, is_valid_source
from data.database import Database, recreate_database, MatchSelector, row_to_post, RangeSelector, FollowedCoin, \
    FollowedSource
from backend.user import get_user_by_username, verify_password, create_user, UserInfo, \
    check_session, new_session, remove_session
from backend.json_helpers import *
import numpy as np

app = Flask(__name__)
app.secret_key = b'f&#Uj**pF(G6R5O'
app.config["JSONIFY_PRETTYPRINT_REGULAR"] = True
app.config["CORS_SUPPORTS_CREDENTIALS"] = True

CORS(app)


def get_coin_type_arg() -> Optional[misc.CoinType]:
    coin_type = request.args.get("type", type=str, default=None)
    if coin_type is None:
        return None
    try:
        # Convert to enum.
        coin_type = misc.CoinType(coin_type)
    except ValueError:
        return None
    return coin_type


def get_token_arg() -> str:
    token = request.args.get("token", type=str, default=None)
    return token


def get_user_from_token(db: Database) -> Optional[UserInfo]:
    token = get_token_arg()
    return check_session(db, token)


# TODO: MAKE PREDICTIONS WHEN THE POST IS COLLECTED AND SAVE IT TO DATABASE. IDEALLY THIS SHOULDN'T BE HERE.
predictor = Predictor("test_model", "Jun19_Feb21_Big")


@app.route("/api/posts")
def get_posts():
    start = request.args.get("start", type=int, default=0)
    end = request.args.get("end", type=int, default=int(time.time()))  # Connect to the database
    coin_type = get_coin_type_arg()
    selectors = [RangeSelector("time", start, end)]
    source = request.args.get("source", type=str, default=None)
    user = request.args.get("user", type=str, default=None)
    if coin_type is not None:
        selectors.append(MatchSelector("coin_type", coin_type.value))
    if source is not None and source != "*":
        selectors.append(MatchSelector("source", source))
    if user is not None and user != "*":
        selectors.append(MatchSelector("user", user))
    # Connect to the database
    db = Database()
    posts = db.read_by("posts", selectors, row_to_post)

    # TODO: MAKE PREDICTIONS WHEN THE POST IS COLLECTED AND SAVE IT TO DATABASE. IDEALLY THIS SHOULDN'T BE HERE.
    posts = predictor.predict(posts)

    # Sort by time.
    posts = sorted(posts, key=lambda p: p.time, reverse=True)
    return jsonify([post_to_dict(p) for p in posts])


@app.route("/api/prices")
def get_prices():
    start = request.args.get("start", type=int, default=0)
    end = request.args.get("end", type=int, default=int(time.time()))
    coin_type = get_coin_type_arg()
    if coin_type is None:
        return jsonify({"result": "error", "error_msg": "Invalid coin type."})
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


@app.route("/api/source_list")
def get_source_list():
    sources = get_all_sources()
    return jsonify([{
            "username": src.username,
            "source": src.source
        } for src in sources])


@app.route("/api/post_volume")
def calculate_post_volume():
    start = request.args.get("start", type=float, default=0)
    end = request.args.get("end", type=float, default=int(time.time()))
    ticks = request.args.get("ticks", type=int, default=100)
    coin_type = get_coin_type_arg()
    if coin_type is None:
        return jsonify({"result": "error", "error_msg": "Invalid coin type."})
    # Connect to the database
    db = Database()
    posts = db.read_posts_by_time_and_coin_type(start, end, coin_type)
    full_range = end - start
    tick_range = full_range / ticks
    volumes = []
    for (i, curr_tick) in enumerate(np.arange(start, end - tick_range + 1, tick_range)):
        tick_start = curr_tick
        tick_end = curr_tick + tick_range
        count = sum(1 for p in posts if tick_start <= p.time <= tick_end)
        volume = count
        if i > 0:
            volume += volumes[i-1]['volume']
        volumes.append({
            'time': tick_start,
            'next_time': tick_end,
            'volume': volume,
            'count': count
        })
    return jsonify(volumes)


@app.route("/api/prediction")
def prediction():
    # TODO implement
    return jsonify({})


@app.route("/user/login", methods=["POST"])
def login():
    username = request.form.get("username", default="")
    password = request.form.get("password", default="")
    if username == "" or password == "":
        return jsonify({"result": "error", "error_type": 0, "error_msg": "Please provide credentials."})
    db = Database()
    user = get_user_by_username(db, username)
    # Check the existence of the user.
    if user is None:
        return jsonify({"result": "error", "error_type": 1, "error_msg": "Invalid user."})
    # Check the password.
    if not verify_password(password, user.user.password, user.user.salt):
        return jsonify({"result": "error", "error_type": 2, "error_msg": "Invalid password."})
    token = new_session(db, user.user.id)
    return jsonify({"result": "ok", "token": token})


@app.route("/user/register", methods=["POST"])
def register():
    username = request.form.get("username", default="")
    password = request.form.get("password", default="")
    if username == "" or password == "":
        return jsonify({"result": "error", "error_type": 0, "error_msg": "Please provide credentials."})
    db = Database()
    success = create_user(db, username, password)
    if not success:
        return jsonify({"result": "error", "error_type": 1, "error_msg": "User already exists."})
    return jsonify({"result": "ok"})


@app.route("/user/logout")
def logout():
    token = get_token_arg()
    if token is None:
        return jsonify({"result": "error", "error_msg": "No token given."})
    db = Database()
    remove_session(db, token)
    return jsonify({"result": "ok"})


@app.route("/user/info")
def get_user_info():
    db = Database()
    user = get_user_from_token(db)
    if user is None:
        return jsonify({"result": "error"})
    d = dictify(user, {'password', 'salt'})
    return jsonify({"result": "ok", "userinfo": d})


@app.route("/user/follow_coin")
def follow_coin():
    coin_type = get_coin_type_arg()
    # Check whether the requested coin type is valid.
    if coin_type is None:
        return jsonify({"result": "error", "error_msg": "Invalid coin type."})
    unfollow_flag = request.args.get("unfollow", type=int, default=0)
    unfollow = unfollow_flag == 1
    db = Database()
    user = get_user_from_token(db)
    if user is None:
        return jsonify({"result": "error", "error_msg": "Invalid token."})
    # Follow
    if not unfollow:
        if coin_type in [fc.coin_type for fc in user.followed_coins]:
            return jsonify({"result": "error", "error_msg": "Already following."})
        # Follow the coin.
        db.create("followed_coins", [FollowedCoin(-1, user.user.id, coin_type)])
    # Unfollow
    else:
        followed = next(filter(lambda fc: coin_type == fc.coin_type, user.followed_coins), None)
        if followed is None:
            return jsonify({"result": "error", "error_msg": "Already unfollowed."})
        # Unfollow the followed coin.
        db.delete_by("followed_coins", [MatchSelector("id", followed.id)])
    return jsonify({"result": "ok"})


@app.route("/user/follow_source")
def follow_source():
    requested_source = request.args.get("source", type=str, default=None)
    # Check whether the requested source corresponds to a supported source.
    is_valid = is_valid_source(requested_source)
    if not is_valid:
        return jsonify({"result": "error", "error_msg": "No such source."})
    unfollow_flag = request.args.get("unfollow", type=int, default=0)
    unfollow = unfollow_flag == 1
    db = Database()
    user = get_user_from_token(db)
    if user is None:
        return jsonify({"result": "error", "error_msg": "Invalid token."})
    # Get the sources the user is already following.
    followed_sources_set = set([src.__repr__() for src in user.followed_sources])
    # Follow
    if not unfollow:
        # If the user is already following the source, no need to add it again.
        if requested_source in followed_sources_set:
            return jsonify({"result": "error", "error_msg": "Already following."})
        # Follow the new source.
        db.create("followed_sources", [FollowedSource(-1, user.user.id, requested_source)])
    # Unfollow
    else:
        # Get the followed source instance.
        followed = next(filter(lambda fc: requested_source == fc.source, user.followed_sources), None)
        if followed is None:
            return jsonify({"result": "error", "error_msg": "Already unfollowed."})
        # Unfollow the followed source.
        db.delete_by("followed_sources", [MatchSelector("id", followed.id)])
    return jsonify({"result": "ok"})


if __name__ == "__main__":
    # recreate_database()
    app.run()
