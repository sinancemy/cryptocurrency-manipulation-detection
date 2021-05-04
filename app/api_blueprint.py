import time

from flask import Blueprint

from backend.json_helpers import post_to_dict, price_to_dict, dictify
from data.collector.sources import get_all_sources
from data.database import RangeSelector, MatchSelector, SourceSelector, row_to_post, row_to_post_volume, Database
from helpers import *

api_blueprint = Blueprint("api", __name__)


@api_blueprint.route("/posts")
def get_posts():
    start = request.args.get("start", type=int, default=0)
    end = request.args.get("end", type=int, default=int(time.time()))  # Connect to the database
    coin_type = get_coin_type_arg()
    selectors = [RangeSelector("time", start, end)]
    source = request.args.get("source", type=str, default=None)
    order_by = request.args.get("sort", type=str, default=None)
    desc = request.args.get("desc", type=int, default=0)
    limit = request.args.get("limit", type=int, default=50)
    # We return 50 posts per request at most.
    limit = min(limit, 50)
    if coin_type is not None:
        selectors.append(MatchSelector("coin_type", coin_type.value))
    if source is not None and "@" in source:
        sources = source.split(";")
        selectors.append(SourceSelector(sources))
    # Disallow invalid sorting options to prevent SQL injections.
    if order_by is not None and order_by not in ["interaction", "impact", "time", "user"]:
        order_by = None
    # Handle the parameters for infinite scrolling.
    from_interaction = request.args.get("from_interaction", type=int, default=None)
    from_time = request.args.get("from_time", type=int, default=None)
    from_user = request.args.get("from_user", type=str, default=None)
    if from_interaction is not None:
        selectors.append(RangeSelector("interaction",
                                       from_interaction if desc == 0 else None,
                                       from_interaction if desc == 1 else None,
                                       closed=False))
    if from_time is not None:
        selectors.append(RangeSelector("time",
                                       from_time if desc == 0 else None,
                                       from_time if desc == 1 else None,
                                       closed=False))
    if from_user is not None:
        selectors.append(RangeSelector("user",
                                       from_user if desc == 0 else None,
                                       from_user if desc == 1 else None,
                                       closed=False))
    # Connect to the database
    db = Database()
    posts = db.read_by("posts", selectors, row_to_post, order_by=order_by, desc=desc, limit=limit)

    # TODO: MAKE PREDICTIONS WHEN THE POST IS COLLECTED AND SAVE IT TO DATABASE. IDEALLY THIS SHOULDN'T BE HERE.
    if len(posts) > 0:
        posts = posts  # predictor.predict(posts)
    # Sort by time.
    return jsonify([post_to_dict(p) for p in posts])


@api_blueprint.route("/prices")
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


@api_blueprint.route("/coin_list")
def get_coin_list():
    coin_types = []
    for coin_type in misc.CoinType:
        coin_types.append({"name": coin_type,
                           "image": ""})
    return jsonify(coin_types)


@api_blueprint.route("/source_list")
def get_source_list():
    db = Database()
    return jsonify(get_all_sources(db))


@api_blueprint.route("/post_volume")
def get_post_volumes():
    start = request.args.get("start", type=float, default=0)
    end = request.args.get("end", type=float, default=int(time.time()))
    coin_type = get_coin_type_arg()
    if coin_type is None:
        return jsonify({"result": "error", "error_msg": "Invalid coin type."})
    # Connect to the database
    db = Database()
    volumes = db.read_by("post_volumes", [MatchSelector("source", "coin:" + coin_type.value),
                                          RangeSelector("time", start, end)], row_to_post_volume)
    return jsonify(list(map(lambda v: v.__dict__, volumes)))


from data.database.app_models import Follow, FollowType


@api_blueprint.route("/coin_stats")
def get_coin_stats():
    coin_type = get_coin_type_arg()
    top_user_limit = request.args.get("userlimit", type=int, default=5)
    top_source_limit = request.args.get("sourcelimit", type=int, default=5)
    if coin_type is None:
        return jsonify({"result": "error", "error_msg": "Invalid coin type."})
    api_db = Database()
    top_sources = api_db.read_top_sources(coin_type, top_source_limit,
                                          lambda row: {"total_msg": row[0],
                                                       "source": "*@" + row[5]})
    top_active_users = api_db.read_top_active_users(coin_type, top_user_limit,
                                                    lambda row: {"total_msg": row[0],
                                                                 "source": row[3] + "@" + row[5]})
    top_interacted_users = api_db.read_top_interacted_users(coin_type, top_user_limit,
                                                            lambda row: {"total_interaction": row[0],
                                                                         "source": row[3] + "@" + row[5]})
    last_price = api_db.read_last_price(coin_type)
    num_followers = Follow.query.filter_by(type=FollowType.coin, target=coin_type.value).count()
    return jsonify({
        "num_followers": num_followers,
        "top_sources": top_sources,
        "top_active_users": top_active_users,
        "top_interacted_users": top_interacted_users,
        "last_price": dictify(last_price, excluded_keys={"type"})
    })


@api_blueprint.route("/source_stats")
def get_source_stats():
    source = request.args.get("source", type=str, default=None)
    top_user_limit = request.args.get("userlimit", type=int, default=5)
    relevant_coin_limit = request.args.get("coinlimit", type=int, default=5)
    if source is None:
        return jsonify({"result": "error", "error_msg": "Invalid source."})
    api_db = Database()
    source_parts = source.split("@")
    # Handle the user stat case.
    if not source.startswith("*@"):
        num_followers = Follow.query.filter_by(type=FollowType.source, target=source).count()
        return jsonify({
            "num_followers": num_followers
        })
    # Handle the source stat case.
    # Get the top active users.
    top_active_users = api_db.read_grouped_tops("posts", "user", "COUNT(id)", top_user_limit,
                                            [MatchSelector("source", source_parts[1])],
                                            lambda row: {"total_msg": row[0],
                                                         "source": row[3] + "@" + source_parts[1]})
    # Get the top interacted users.
    top_interacted_users = api_db.read_grouped_tops("posts", "user", "SUM(interaction)", top_user_limit,
                                                [MatchSelector("source", source_parts[1])],
                                                lambda row: {"total_interaction": row[0],
                                                             "source": row[3] + "@" + source_parts[1]})
    # Get the most relevant coins.
    relevant_coins = api_db.read_grouped_tops("posts", "coin_type", "COUNT(id)", relevant_coin_limit,
                                          [MatchSelector("source", source_parts[1])],
                                          lambda row: {"msg_count": row[0], "coin_type": row[2]})
    # Get the number of followers.
    num_followers = Follow.query.filter_by(type=FollowType.source, target=source).count()
    return jsonify({
        "num_followers": num_followers,
        "top_active_users": top_active_users,
        "top_interacted_users": top_interacted_users,
        "relevant_coins": relevant_coins
    })
