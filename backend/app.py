from flask import Flask, request, jsonify, make_response
import time
import misc
from data.database import Database
from json_helpers import *

app = Flask(__name__)


@app.route("/api/posts")
def get_posts():
    return "posts"


@app.route("/api/prices")
def get_prices():
    start = request.args.get("start", type=int, default=-1)
    if start < 0:
        return "start parameter is invalid"
    coin_type = request.args.get("type", type=str, default=None)
    if coin_type is None:
        return "coin type is invalid"
    try:
        coin_type = misc.CoinType(coin_type)
    except:
        return "coin type is invalid"
    end = request.args.get("end", type=int, default=int(time.time()))
    # Connect to the database
    db = Database()
    prices = db.read_prices_by_time_and_coin_type(start, end, coin_type)
    return jsonify([price_to_json(p) for p in prices])


if __name__ == "__main__":
    app.run()