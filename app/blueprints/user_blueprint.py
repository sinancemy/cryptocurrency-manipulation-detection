import dataclasses
import secrets
import time

from flask import Blueprint, request, jsonify, url_for, current_app
from sqlalchemy import desc

from backend.google_login import construct_request_uri, callback
from backend.app_helpers import get_json_arg, login_required
from data.database.app_models import User, db, Session, Follow, Trigger, Notification, PasswordReset
from misc import TriggerTimeWindow, FollowType
from backend.password import verify_password, new_password
from app.main_app import create_app
from backend.processor.mail_deployment import Mailer

user_blueprint = Blueprint("user", __name__)


# TODO: isValidCoin, isValidSource, isValidEmail checks!


@user_blueprint.route("/login", methods=["POST"])
def login():
    form = request.get_json()
    username = get_json_arg(form, "username", type=str, default="")
    password = get_json_arg(form, "password", type=str, default="")
    username = username.strip()
    if username == "" or password == "":
        return jsonify({"result": "error", "error_type": 0, "error_msg": "Please provide credentials."})
    user = User.query.filter_by(username=username).first()
    # Check the existence of the user.
    if user is None:
        return jsonify({"result": "error", "error_type": 1, "error_msg": "Invalid user."})
    # Check the password.
    if not verify_password(password, user.password, user.salt):
        return jsonify({"result": "error", "error_type": 2, "error_msg": "Invalid password."})
    new_token = secrets.token_hex(64)
    new_session = Session(user_id=user.id, token=new_token,
                          expiration=time.time() + 60 * 24 * 10)
    db.session.add(new_session)
    db.session.commit()
    return jsonify({"result": "ok", "token": new_token})


@user_blueprint.route("/login/google", methods=["GET"])
def login_with_google():
    return construct_request_uri(url_for("user.login_callback", _external=True))


@user_blueprint.route("/login/google/callback", methods=["GET"])
def login_callback():
    callback()


@user_blueprint.route("/register", methods=["POST"])
def register():
    form = request.get_json()
    username = get_json_arg(form, "username", type=str, default="")
    password = get_json_arg(form, "password", type=str, default="")
    email = get_json_arg(form, "email", type=str, default="")
    username = username.strip()
    email = email.strip()
    if username == "" or password == "" or email == "":
        return jsonify({"result": "error", "error_type": 0, "error_msg": "Please provide credentials."})
    user_count = User.query.filter_by(username=username).count()
    email_count = User.query.filter_by(email=email).count()
    if user_count > 0:
        return jsonify({"result": "error", "error_type": 1, "error_msg": "User already exists."})
    elif email_count > 0:
        return jsonify({"result": "error", "error_type": 2, "error_msg": "E-mail already in use."})

    pw_hash, salt = new_password(password)
    new_user = User(username=username, email=email, password=pw_hash, salt=salt)
    # Insert into the database.
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"result": "ok"})


@user_blueprint.route("/logout", methods=["POST"])
@login_required
def logout(form, session):
    db.session.delete(session)
    db.session.commit()
    return jsonify({"result": "ok"})


@user_blueprint.route("/info", methods=["POST"])
@login_required
def get_user_info(form, session):
    # Convert to a dict preemptively.
    shown_user = dataclasses.asdict(session.user)
    shown_user.pop("password")
    shown_user.pop("salt")
    shown_user.pop("sessions")
    return jsonify({"result": "ok", "userinfo": shown_user})


@user_blueprint.route("/info/notifications", methods=["POST"])
@login_required
def read_notifications(form, session):
    notifications = Notification.query \
        .filter_by(user_id=session.user_id) \
        .order_by(desc(Notification.time)) \
        .all()
    return jsonify({"result": "ok", "notifications": notifications})


@user_blueprint.route("/info/notifications/read_all", methods=["POST"])
@login_required
def set_all_notifications_to_read(form, session):
    notifications = Notification.query \
        .filter_by(user_id=session.user_id) \
        .all()
    for notification in notifications:
        notification.read = True
    db.session.commit()
    return jsonify({"result": "ok"})


@user_blueprint.route("/info/notifications/delete", methods=["POST"])
@login_required
def discard_notification(form, session):
    notification_id = get_json_arg(form, "id", int, None)
    if notification_id is None:
        return jsonify({"result": "error", "error_msg": "Insufficient arguments."})
    notification = Notification.query \
        .filter_by(id=notification_id, user_id=session.user_id) \
        .first()
    if notification is None:
        return jsonify({"result": "error", "error_msg": "Invalid notification."})
    db.session.delete(notification)
    db.session.commit()
    return jsonify({"result": "ok"})


@user_blueprint.route("/update", methods=["POST"])
@login_required
def update_user(form, session):
    password = get_json_arg(form, "password", type=str, default=None)
    email = get_json_arg(form, "email", type=str, default=None)
    if password is not None:
        hash, salt = new_password(password)
        session.user.password = hash
        session.user.salt = salt
    if email is not None:
        session.user.email = email
    db.session.commit()
    return jsonify({"result": "ok"})


@user_blueprint.route("/delete_user", methods=["POST"])
@login_required
def delete_user(form, session):
    user = User.query.filter_by(id=session.user_id).first()
    db.session.delete(user)
    db.session.commit()
    return jsonify({"result": "ok"})


@user_blueprint.route("/send_mail", methods=["POST"])
def send_mail():
    form = request.get_json()
    email = get_json_arg(form, "email", type=str, default="")
    user = User.query.filter(User.email == email).first()
    if user is None:
        return jsonify({"result": "error"})
    code = secrets.token_hex(16)
    reset = PasswordReset(user_id=user.id, code=code)
    db.session.add(reset)
    db.session.commit()
    app = current_app
    mailer = Mailer(app)
    mailer.send_reset_mail(email, code)
    return jsonify({"result": "ok"})


@user_blueprint.route("/reset_password", methods=["POST"])
def reset_password():
    form = request.get_json()
    code = get_json_arg(form, "code", type=str, default="")
    password = get_json_arg(form, "password", type=str, default="")
    reset = PasswordReset.query.filter_by(code=code).first()
    if reset is None:
        return jsonify({"result": "error"})
    currentUser = User.query.filter_by(id=reset.user_id).first()
    pw_hash, salt = new_password(password)
    currentUser.password = pw_hash
    currentUser.salt = salt
    db.session.delete(reset)
    db.session.commit()
    return jsonify({"result": "ok"})


@user_blueprint.route("/change_password", methods=["POST"])
@login_required
def change_password(form, session):
    form = request.get_json()
    newPassword = get_json_arg(form, "newPassword", type=str, default="")
    oldPassword = get_json_arg(form, "oldPassword", type=str, default="")
    if not verify_password(oldPassword, session.user.password, session.user.salt):
        return jsonify({"result": "error"})
    hash, salt = new_password(newPassword)
    session.user.password = hash
    session.user.salt = salt
    db.session.commit()
    return jsonify({"result": "ok"})


@user_blueprint.route("/change_email", methods=["POST"])
@login_required
def change_email(form, session):
    form = request.get_json()
    password = get_json_arg(form, "password", type=str, default="")
    newEmail = get_json_arg(form, "newEmail", type=str, default="")
    if not verify_password(password, session.user.password, session.user.salt):
        return jsonify({"result": "error"})
    session.user.email = newEmail
    db.session.commit()
    return jsonify({"result": "ok"})


@user_blueprint.route("/follow/create", methods=["POST"])
@login_required
def create_follow(form, session):
    follow_type = get_json_arg(form, "type", type=FollowType, default=FollowType.coin)
    follow_target = get_json_arg(form, "target", type=str, default="")
    notify_email = get_json_arg(form, "notify", type=bool, default=False)
    # TODO check if target is valid.
    new_follow_entry = Follow(user_id=session.user.id, target=follow_target, notify_email=notify_email,
                              type=follow_type)
    db.session.add(new_follow_entry)
    db.session.commit()
    return jsonify({"result": "ok"})


@user_blueprint.route("/follow/delete", methods=["POST"])
@login_required
def delete_follow(form, session):
    follow_type = get_json_arg(form, "type", type=FollowType, default=None)
    follow_target = get_json_arg(form, "target", type=str, default=None)
    follow_id = get_json_arg(form, "id", type=int, default=None)
    if follow_id is None and (follow_target is None or follow_type is None):
        return jsonify({"result": "error", "error_msg": "Insufficient arguments."})
    if follow_id:
        follow_entry = Follow.query.filter_by(id=follow_id, user_id=session.user.id).first()
    else:
        follow_entry = Follow.query.filter_by(user_id=session.user.id, target=follow_target, type=follow_type).first()
    if follow_entry is None:
        return jsonify({"result": "error", "error_msg": "No such follow."})
    db.session.delete(follow_entry)
    db.session.commit()
    return jsonify({"result": "ok"})


@user_blueprint.route("/follow/update", methods=["POST"])
@login_required
def update_follow(form, session):
    follow_type = get_json_arg(form, "type", type=FollowType, default=None)
    follow_target = get_json_arg(form, "target", type=str, default=None)
    follow_id = get_json_arg(form, "id", type=int, default=None)
    notify_email = get_json_arg(form, "notify", type=bool, default=False)
    if follow_id is None and (follow_target is None or follow_type is None):
        return jsonify({"result": "error", "error_msg": "Insufficient arguments."})
    if follow_id:
        follow_entry = Follow.query.filter_by(id=follow_id, user_id=session.user.id).first()
    else:
        follow_entry = Follow.query.filter_by(user_id=session.user.id, target=follow_target, type=follow_type).first()
    if follow_entry is None:
        return jsonify({"result": "error", "error_msg": "No such follow."})
    follow_entry.notify_email = notify_email
    db.session.commit()
    return jsonify({"result": "ok"})


@user_blueprint.route("/trigger/create", methods=["POST"])
@login_required
def create_trigger(form, session):
    follow_id = get_json_arg(form, "follow_id", type=int, default=None)
    time_window = get_json_arg(form, "time_window", type=TriggerTimeWindow, default=TriggerTimeWindow.one_hour)
    threshold = get_json_arg(form, "threshold", type=int, default=5)
    if follow_id is None:
        return jsonify({"result": "error", "error_msg": "No follow id provided."})
    follow = Follow.query.filter_by(id=follow_id, user_id=session.user_id).first()
    if follow is None:
        return jsonify({"result": "error", "error_msg": "Invalid follow id."})
    if follow.type == FollowType.source and not follow.target.startswith("*@"):
        return jsonify({"result": "error", "error_msg": "Creating triggers for users is disallowed."})
    trigger_count = db.session.query(Trigger).join(Follow) \
        .filter(Follow.user_id == session.user.id) \
        .filter(Follow.id == follow_id) \
        .count()
    if trigger_count >= 3:
        return jsonify({"result": "error", "error_msg": "Max triggers reached."})
    new_trigger = Trigger(follow_id=follow_id, time_window=time_window, threshold=threshold)
    db.session.add(new_trigger)
    db.session.commit()
    return jsonify({"result": "ok"})


@user_blueprint.route("/trigger/create", methods=["POST"])
@login_required
def read_trigger(form, session):
    trigger_id = get_json_arg(form, "id", type=int, default=None)
    if trigger_id is None:
        return jsonify({"result": "error", "error_msg": "No trigger id provided."})
    trigger = db.session.query(Trigger).join(Follow) \
        .filter(Follow.user_id == session.user.id) \
        .filter(Trigger.id == trigger_id) \
        .first()
    if trigger is None:
        return jsonify({"result": "error", "error_msg": "Invalid trigger id."})
    return jsonify({"result": "ok", "trigger": trigger})


@user_blueprint.route("/trigger/delete", methods=["POST"])
@login_required
def delete_trigger(form, session):
    trigger_id = get_json_arg(form, "id", type=int, default=None)
    if trigger_id is None:
        return jsonify({"result": "error", "error_msg": "No trigger id provided."})
    trigger = db.session.query(Trigger).join(Follow) \
        .filter(Follow.user_id == session.user.id) \
        .filter(Trigger.id == trigger_id) \
        .first()
    if trigger is None:
        return jsonify({"result": "error", "error_msg": "Invalid trigger id."})
    db.session.delete(trigger)
    db.session.commit()
    return jsonify({"result": "ok", "trigger": trigger})


@user_blueprint.route("/trigger/update", methods=["POST"])
@login_required
def update_trigger(form, session):
    trigger_id = get_json_arg(form, "id", type=int, default=None)
    time_window = get_json_arg(form, "time_window", type=TriggerTimeWindow, default=None)
    threshold = get_json_arg(form, "threshold", type=int, default=None)
    if trigger_id is None:
        return jsonify({"result": "error", "error_msg": "No trigger id provided."})
    trigger = db.session.query(Trigger).join(Follow) \
        .filter(Follow.user_id == session.user.id) \
        .filter(Trigger.id == trigger_id) \
        .first()
    if trigger is None:
        return jsonify({"result": "error", "error_msg": "Invalid trigger id."})
    if time_window is not None:
        trigger.time_window = time_window
    if threshold is not None:
        trigger.threshold = threshold
    db.session.commit()
    return jsonify({"result": "ok", "trigger": trigger})
