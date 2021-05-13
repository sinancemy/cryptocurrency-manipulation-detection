from functools import wraps
from typing import Optional

from flask import request, jsonify

import misc
from data.collector.sources import get_exported_sources
from data.database import Session, db, Post


# Called from /api blueprint
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


# Called from /user blueprint.
def get_token_arg() -> str:
    form = request.get_json()
    token = form.get("token", None)
    return str(token) if token is not None else None


def get_json_arg(form, key, type, default):
    val = form.get(key, default)
    if val is None:
        return default
    try:
        val = type(val)
    except (TypeError, ValueError):
        return default
    return val


def get_session(form) -> Optional[Session]:
    token = get_json_arg(form, "token", type=str, default=None)
    if token is None:
        return None
    session = Session.query.filter_by(token=token).first()
    return session


def login_required(inner_func):
    @wraps(inner_func)
    def wrapper(*args, **kwargs):
        form = request.get_json()
        session = get_session(form)
        if session is None:
            return jsonify({"result": "error", "error_msg": "Invalid session."})
        return inner_func(form, session, *args, **kwargs)

    return wrapper


def get_all_sources() -> list:
    db_sources = [{"user": r[0], "source": r[1]} for r in
                  db.session.query(Post.user, Post.source).distinct(Post.user, Post.source).all()]
    exported_sources = [{"user": src.user, "source": src.source} for src in get_exported_sources()]
    # Combine them.
    all_sources = db_sources + exported_sources
    uniques_set = {s["user"] + '@' + s["source"] for s in all_sources}
    return list(uniques_set)


def get_all_users() -> list:
    return list(filter(lambda s: not s.startswith("*@"), get_all_sources()))


def get_all_groups() -> list:
    return list(filter(lambda s: s.startswith("*@"), get_all_sources()))
