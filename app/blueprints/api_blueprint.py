import json
import time

import numpy
from flask import Blueprint
from sqlalchemy import desc, and_, or_, func

from backend import api_settings
from data.database import Price, Follow, dataclasses, StreamedPost
from data.database.aggregate_models import AggregatePostCount, AggregatePostImpact, StreamedAggregatePostCount
from misc import FollowType
from backend.app_helpers import *
import Levenshtein

api_blueprint = Blueprint("api", __name__)


@api_blueprint.route("/info")
def get_info():
    return jsonify({
        "genesis": api_settings.GENESIS,
        "last_epoch": api_settings.get_last_epoch(),
        "last_streamed_post_update": api_settings.get_last_aggr_stream_time(),
        "last_price_update": api_settings.get_last_price_time(),
        "available_settings": api_settings.get_as_dict()
    })


def create_source_conditions(sources: list, model) -> list:
    source_conditions = []
    for source in sources:
        source_parts = source.split("@")
        if source_parts[0] == "*":
            source_conditions.append(model.source == source_parts[1])
        else:
            source_conditions.append(and_(model.source == source_parts[1],
                                          model.user == source_parts[0]))
    return source_conditions


def prepare_post_query(model, start, end, coin_type, sources, order_by, orderable_columns, from_bound, desc, limit, group_by_unique_id=False):
    query = db.session.query(model) \
        .filter(model.time >= start) \
        .filter(model.time <= end)
    if coin_type is not None:
        query = query.filter(model.coin_type == coin_type)
    if sources is not None:
        source_conditions = create_source_conditions(sources, model)
        query = query.filter(or_(*source_conditions))
    if order_by is not None and order_by in orderable_columns:
        if from_bound is not None:
            from_column = model.__table__.c[order_by]
            if desc == 1:
                query = query.filter(from_column < from_bound)
            else:
                query = query.filter(from_column > from_bound)
        if desc == 1:
            query = query.order_by(model.__table__.c[order_by].desc())
        else:
            query = query.order_by(model.__table__.c[order_by])
    # Unique id filtering for posts.
    if group_by_unique_id:
        query = query.group_by(model.__table__.c["unique_id"])
    return query.limit(limit)


@api_blueprint.route("/posts")
def get_posts():
    start = request.args.get("start", type=int, default=0)
    end = request.args.get("end", type=int, default=int(time.time()))
    coin_type = get_coin_type_arg()
    source = request.args.get("source", type=str, default=None)
    order_by = request.args.get("sort", type=str, default=None)
    desc = request.args.get("desc", type=int, default=0)
    limit = request.args.get("limit", type=int, default=50)
    # We return 50 posts per request at most.
    limit = min(limit, 50)
    # Construct the initial query.
    if source is not None and "@" in source:
        sources = source.split(";")
    else:
        sources = None
    # Disallow invalid sorting options to prevent SQL injections.
    if order_by is not None and order_by not in ["interaction", "impact", "time", "user"]:
        order_by = None
    if order_by == "impact":
        order_by = "avg_impact"
    # Handle the infinite scrolling.
    if order_by is not None:
        order_by_types = {"interaction": int, "avg_impact": float, "time": int, "user": str}
        from_bound = request.args.get("from", type=order_by_types[order_by], default=None)
    else:
        from_bound = None
    posts = [dataclasses.asdict(p) for p in
             prepare_post_query(Post, start, end, coin_type, sources, order_by,
                                ["interaction", "impact", "time", "user"],
                                from_bound, desc, limit, group_by_unique_id=True).all()]
    # Replace the impact values by their float array representation.
    for p in posts:
        p["impact"] = list(numpy.frombuffer(p["impact"]))
        p["streamed"] = False
    # Get the streamed posts.
    streamed_posts = [dataclasses.asdict(p) for p in
                      prepare_post_query(StreamedPost, start, end, coin_type, sources, order_by,
                                         ["time", "user"], from_bound, desc, limit, group_by_unique_id=False).all()]
    for p in streamed_posts:
        p["avg_impact"] = 0
        p["impact"] = [0, 0, 0, 0]
        p["interaction"] = 0
        p["streamed"] = True
    # Merge the posts.
    all_posts = posts + streamed_posts
    return jsonify(all_posts[:limit])


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
    return jsonify([c for c in misc.CoinType])


@api_blueprint.route("/source_list")
def get_source_list():
    return jsonify(get_all_sources())


def string_comparator(haystack: str, needle: str):
    needle = needle.strip().lower()
    haystack = haystack.strip().lower()
    if needle == haystack:
        return 0
    if haystack.startswith(needle):
        return 1
    if haystack.endswith(needle):
        return 2
    if len(needle) > 3 and needle in haystack:
        return 3
    return Levenshtein.distance(needle, haystack) + 3


@api_blueprint.route("/search")
def search():
    search_type = request.args.get("type", type=str, default=None)
    query = request.args.get("query", type=str, default=None)
    if search_type is None or search_type not in ["coin", "user", "group"]:
        return jsonify({"result": "error", "error_msg": "Invalid search type."})
    if search_type == "coin":
        comparator = lambda x: string_comparator(x.value, query)
        alls = [c for c in misc.CoinType]
    elif search_type == "user":
        comparator = lambda x: string_comparator(x.split("@")[0], query)
        alls = filter(lambda x: comparator(x) < 10, get_all_users())
    elif search_type == "group":
        comparator = lambda x: string_comparator(x.split("@")[1], query)
        alls = filter(lambda x: comparator(x) < 10, get_all_groups())
    return jsonify(sorted(alls, key=comparator)[:10])


@api_blueprint.route("/aggregate/streamed_post_counts")
def get_streamed_aggregate_post_counts():
    coin_type = get_coin_type_arg()
    if coin_type is None:
        return jsonify({"result": "error", "error_msg": "Invalid coin type."})
    last_crawled_post = db.session.query(Post.time).order_by(desc(Post.time)).limit(1).first()
    if last_crawled_post is None:
        start = 0
    else:
        start = last_crawled_post.time
    post_counts = StreamedAggregatePostCount.query \
        .filter(StreamedAggregatePostCount.time >= start) \
        .filter(StreamedAggregatePostCount.source == "coin:" + coin_type.value) \
        .all()
    return jsonify(post_counts)


@api_blueprint.route("/aggregate/post_counts")
def get_aggregate_post_counts():
    start = request.args.get("start", type=int, default=0)
    end = request.args.get("end", type=int, default=int(time.time()))
    sma = request.args.get("sma", type=str, default=None)
    coin_type = get_coin_type_arg()
    if coin_type is None:
        return jsonify({"result": "error", "error_msg": "Invalid coin type."})
    post_counts = AggregatePostCount.query \
        .filter(AggregatePostCount.time <= end) \
        .filter(AggregatePostCount.time >= start) \
        .filter(AggregatePostCount.source == "coin:" + coin_type.value) \
        .all()
    post_counts = [dataclasses.asdict(p) for p in post_counts]
    for p in post_counts:
        # Select the correct SMA
        smas = json.loads(p['smas'])
        p['sum'] = smas[sma]
        p.pop('smas')
    # Remove unnecessary data.
    sma_window = int(api_settings.SMA_TO_SECONDS[sma] / api_settings.POST_COUNT_INTERVAL)
    post_counts = post_counts[::sma_window]
    return jsonify(post_counts)


@api_blueprint.route("/aggregate/post_impacts")
def get_aggregate_post_impacts():
    start = request.args.get("start", type=float, default=0)
    end = request.args.get("end", type=float, default=int(time.time()))
    coin_type = get_coin_type_arg()
    if coin_type is None:
        return jsonify({"result": "error", "error_msg": "Invalid coin type."})
    post_counts = AggregatePostImpact.query \
        .filter(AggregatePostImpact.time <= end) \
        .filter(AggregatePostImpact.time >= start) \
        .filter(AggregatePostImpact.source == "coin:" + coin_type.value) \
        .all()
    return jsonify(post_counts)


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
    num_followers = Follow.query.filter_by(type=FollowType.coin, target=coin_type.value).count()
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
    top_active_users = db.session.query(Post.user, func.count(Post.id)) \
        .filter(Post.source == source_parts[1]) \
        .group_by(Post.user) \
        .order_by(desc(func.count(Post.id))) \
        .limit(limit) \
        .all()
    top_active_users = [{"source": r[0] + "@" + source_parts[1], "total_msg": r[1]} for r in top_active_users]
    top_interacted_users = db.session.query(Post.user, func.sum(Post.interaction)) \
        .filter(Post.source == source_parts[1]) \
        .group_by(Post.user) \
        .order_by(desc(func.sum(Post.interaction))) \
        .limit(limit) \
        .all()
    top_interacted_users = [{"source": r[0] + "@" + source_parts[1], "total_interaction": r[1]} for r in
                            top_interacted_users]
    relevant_coins = db.session.query(Post.coin_type, func.count(Post.id)) \
        .filter(Post.source == source_parts[1]) \
        .group_by(Post.coin_type) \
        .order_by(desc(func.count(Post.id))) \
        .limit(limit) \
        .all()
    relevant_coins = [{"coin_type": r[0], "total_msg": r[1]} for r in relevant_coins]
    num_followers = Follow.query.filter_by(type=FollowType.source, target=source).count()
    return jsonify({
        "num_followers": num_followers,
        "top_active_users": top_active_users,
        "top_interacted_users": top_interacted_users,
        "relevant_coins": relevant_coins
    })
