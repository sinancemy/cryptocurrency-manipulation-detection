from flask import Flask
from flask_mail import Mail, Message

from data.database import Trigger, User, db
from app import create_app


class Mailer:
    def __init__(self, app):
        app.config['MAIL_SERVER'] = 'smtp.gmail.com'
        app.config['MAIL_PORT'] = 465
        app.config['MAIL_USE_TLS'] = False
        app.config['MAIL_USE_SSL'] = True
        app.config['MAIL_USERNAME'] = 'surupgroup@gmail.com'
        app.config['MAIL_PASSWORD'] = 'owrumbyinljnpyts'
        app.config['MAIL_DEFAULT_SENDER'] = 'surupgroup@gmail.com'
        self.mail = Mail(app)

    def deploy_mails(self, triggers: list):
        # Get the users
        # {user: [trigger1, trigger2]}
        for trigger in triggers:
            user = User.query \
                .filter(User.id == trigger.follow.user_id) \
                .first()
            # trigger.follow.type is either FollowType.coin or FollowType.source
            # trigger.follow.target is "btc", "eth", "*@twitter"
        msg = Message("Selam", recipients=[])
        msg.body = ""
        self.mail.send(msg)


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        mailer = Mailer(app)
        triggers = db.session.query(Trigger).all()
        mailer.deploy_mails(triggers)
    # app.run(debug=True)
