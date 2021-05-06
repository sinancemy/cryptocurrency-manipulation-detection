import os

from flask import Flask, send_from_directory
from flask_cors import CORS

from data.database import SQLALCHEMY_DATABASE_URI, SQLALCHEMY_BINDS, db, configure_app
from user_blueprint import user_blueprint
from api_blueprint import api_blueprint

NPM_OUT = "../web/web-app/out"


def create_app():
    app = Flask(__name__, static_folder=NPM_OUT, static_url_path="/static")
    app.secret_key = os.environ.get("SECRET_KEY") or os.urandom(24)
    app.config["JSONIFY_PRETTYPRINT_REGULAR"] = True
    CORS(app)
    configure_app(app)
    app.register_blueprint(user_blueprint, url_prefix="/user")
    app.register_blueprint(api_blueprint, url_prefix="/api")

    @app.route("/app")
    @app.route("/app/")
    @app.route("/app/<page>")
    def web_app(page: str = "index"):
        # LOL!
        page += ".html"
        return send_from_directory(NPM_OUT, page)

    db.init_app(app)
    with app.app_context():
        db.create_all()
    return app


# TODO: MAKE PREDICTIONS WHEN THE POST IS COLLECTED AND SAVE IT TO DATABASE. IDEALLY THIS SHOULDN'T BE HERE.
# predictor = Predictor("test_model", "Jun19_Feb21_Big")


if __name__ == "__main__":
    app = create_app()
    # app.run(debug=True, ssl_context="adhoc")
    app.run(debug=True)
