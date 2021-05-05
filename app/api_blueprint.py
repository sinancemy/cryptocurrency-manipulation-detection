import time

from flask import Blueprint
from sqlalchemy import desc, and_, or_, func

from backend.json_helpers import post_to_dict, price_to_dict, dictify
from data.collector.sources import get_all_sources
from data.database import RangeSelector, MatchSelector, SourceSelector, Database, Price, PostVolume, Post, db
from data.database.app_models import Follow, FollowType
from helpers import *

api_blueprint = Blueprint("api", __name__)


@api_blueprint.route("/posts")
def get_posts():
    start = request.args.get("start", type=int, default=0)
    end = request.args.get("end", type=int, default=int(time.time()))  # Connect to the database
    coin_type = get_coin_type_arg()
    source = request.args.get("source", type=str, default=None)
    order_by = request.args.get("sort", type=str, default=None)
    desc = request.args.get("desc", type=int, default=0)
    limit = request.args.get("limit", type=int, default=50)
    # We return 50 posts per request at most.
    limit = min(limit, 50)
    # Construct the initial query.
    query = Post.query.filter(Post.time >= start).filter(Post.time <= end)
    if coin_type is not None:
        query = query.filter(Post.coin_type == coin_type)
    if source is not None and "@" in source:
        sources = source.split(";")
        source_conditions = []
        for source in sources:
            source_parts = source.split("@")
            if source_parts[0] == "*":
                source_conditions.append(Post.source == source_parts[1])
            else:
                source_conditions.append(and_(Post.source == source_parts[1],
                                              Post.user == source_parts[0]))
        query = query.filter(or_(*source_conditions))
    # Disallow invalid sorting options to prevent SQL injections.
    if order_by is not None and order_by not in ["interaction", "impact", "time", "user"]:
        order_by = None
    # Handle the parameters for infinite scrolling.
    from_interaction = request.args.get("from_interaction", type=int, default=None)
    from_time = request.args.get("from_time", type=int, default=None)
    from_user = request.args.get("from_user", type=str, default=None)
    if from_interaction is not None:
        if desc == 0:
            query = query.filter(Post.interaction > from_interaction)
        else:
            query = query.filter(Post.interaction < from_interaction)
    elif from_time is not None:
        if desc == 0:
            query = query.filter(Post.time > from_time)
        else:
            query = query.filter(Post.time < from_time)
    elif from_user is not None:
        if desc == 0:
            query = query.filter(Post.user > from_user)
        else:
            query = query.filter(Post.user < from_user)
    # Handle ordering
    if desc == 1:
        query = query.order_by(Post.__table__.c[order_by].desc())
    else:
        query = query.order_by(Post.__table__.c[order_by])
    query = query.limit(limit)
    posts = query.all()
    # TODO: MAKE PREDICTIONS WHEN THE POST IS COLLECTED AND SAVE IT TO DATABASE. IDEALLY THIS SHOULDN'T BE HERE.
    if len(posts) > 0:
        posts = posts  # predictor.predict(posts)
    # Sort by time.
    return jsonify(posts)


@api_blueprint.route("/prices")
def get_prices():
    start = request.args.get("start", type=int, default=0)
    end = request.args.get("end", type=int, default=int(time.time()))
    coin_type = get_coin_type_arg()
    if coin_type is None:
        return jsonify({"result": "error", "error_msg": "Invalid coin type."})
    # Connect to the database
    prices = Price.query \
        .filter(Price.time <= end) \
        .filter(Price.time >= start) \
        .filter(Price.coin_type == coin_type) \
        .order_by(desc(Price.time)) \
        .all()
    return jsonify(prices)


@api_blueprint.route("/coin_list")
def get_coin_list():
    coin_types = []
    for coin_type in misc.CoinType:
        coin_types.append({"name": coin_type})
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
    volumes = PostVolume.query \
        .filter(PostVolume.time <= end) \
        .filter(PostVolume.time >= start) \
        .filter(PostVolume.source == "coin:" + coin_type.value) \
        .all()
    return jsonify(volumes)


@api_blueprint.route("/coin_stats")
def get_coin_stats():
    coin_type = get_coin_type_arg()
    limit = request.args.get("limit", type=int, default=5)
    if coin_type is None:
        return jsonify({"result": "error", "error_msg": "Invalid coin type."})
    top_sources = db.session.query(Post.source, func.count(Post.coin_type)) \
        .filter(Post.coin_type == coin_type) \
        .group_by(Post.source) \
        .order_by(desc(func.count(Post.coin_type))) \
        .limit(limit) \
        .all()
    top_sources = [{"source": "*@" + r[0], "total_msg": r[1]} for r in top_sources]
    top_active_users = db.session.query(Post.user, Post.source, func.count(Post.coin_type)) \
        .filter(Post.coin_type == coin_type) \
        .group_by(Post.user, Post.source) \
        .order_by(desc(func.count(Post.coin_type))) \
        .limit(limit) \
        .all()
    top_active_users = [{"source": r[0] + "@" + r[1], "total_msg": r[2]} for r in top_active_users]
    top_interacted_users = db.session.query(Post.user, Post.source, func.sum(Post.interaction)) \
        .filter(Post.coin_type == coin_type) \
        .group_by(Post.user, Post.source) \
        .order_by(desc(func.sum(Post.interaction))) \
        .limit(limit) \
        .all()
    top_interacted_users = [{"source": r[0] + "@" + r[1], "total_interaction": r[2]} for r in top_interacted_users]
    last_price = db.session.query(Price.price, Price.time) \
        .filter(Price.coin_type == coin_type) \
        .order_by(desc(Price.time)) \
        .limit(1) \
        .first()
    last_price = last_price[0] if last_price is not None else 0
    num_followers = Follow.query.filter_by(type=FollowType.coin, target=coin_type).count()
    return jsonify({
        "num_followers": num_followers,
        "top_sources": top_sources,
        "top_active_users": top_active_users,
        "top_interacted_users": top_interacted_users,
        "last_price": last_price
    })


@api_blueprint.route("/source_stats")
def get_source_stats():
    source = request.args.get("source", type=str, default=None)
    limit = request.args.get("limit", type=int, default=5)
    if source is None:
        return jsonify({"result": "error", "error_msg": "Invalid source."})
    source_parts = source.split("@")
    # Handle the user stat case.
    if not source.startswith("*@"):
        num_followers = Follow.query.filter_by(type=FollowType.source, target=source).count()
        return jsonify({
            "num_followers": num_followers
        })
    # Handle the source stat case.
    # Get the top active users.
    top_active_users = db.session.query(Post.user, func.count(Post.id)) \
        .filter(Post.source == source) \
        .group_by(Post.user) \
        .order_by(desc(func.count(Post.id))) \
        .limit(limit) \
        .all()
    top_active_users = [{"source": r[0] + "@" + source, "total_msg": r[1]} for r in top_active_users]
    # Get the top interacted users.
    top_interacted_users = db.session.query(Post.user, func.sum(Post.interaction)) \
        .filter(Post.source == source) \
        .group_by(Post.user) \
        .order_by(desc(func.sum(Post.interaction))) \
        .limit(limit) \
        .all()
    top_interacted_users = [{"source": r[0] + "@" + source, "total_interaction": r[1]} for r in top_interacted_users]
    # Get the most relevant coins.
    relevant_coins = db.session.query(Post.coin_type, func.count(Post.id)) \
        .filter(Post.source == source) \
        .group_by(Post.coin_type) \
        .order_by(desc(func.count(Post.id))) \
        .limit(limit) \
        .all()
    # Get the number of followers.
    num_followers = Follow.query.filter_by(type=FollowType.source, target=source).count()
    return jsonify({
        "num_followers": num_followers,
        "top_active_users": top_active_users,
        "top_interacted_users": top_interacted_users,
        "relevant_coins": []
    })
