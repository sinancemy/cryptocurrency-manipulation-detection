from flask import Flask

app = Flask(__name__)


@app.route("/api/posts")
def get_posts():
    return "posts"


@app.route("/api/prices")
def get_prices():
    return "prices"


if __name__ == "__main__":
    app.run()