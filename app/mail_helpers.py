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
        userTriggers = {}
        for trigger in triggers:
            user = User.query \
                .filter(User.id == trigger.follow.user_id) \
                .first()
            userTriggers.setdefault(user.username, [])
            userTriggers[user.username].append(trigger)
            # trigger.follow.type is either FollowType.coin or FollowType.source
            # trigger.follow.target is "btc", "eth", "*@twitter"
        for user1 in userTriggers.keys():
            email = User.query.filter(User.username == user1).first().email
            subject = "Alert about "
            content = "<h2>Dear " + user1 + ",</h2>" + "<p>We would like to notify you about "
            for triggerType in userTriggers.get(user1):
                subject = subject + triggerType.follow.target.upper()
                content = content + triggerType.follow.target.upper()
                if len(userTriggers.get(user1)) > 1:
                    subject = subject + " and "
                    content = content + " and "
            if subject.split()[-1] == "and":
                subject = subject.rsplit(' ', 2)[0]
                content = content.rsplit(' ', 2)[0]
            content = content + ".</p><br>"
            for triggerType in userTriggers.get(user1):
                threshold = str(triggerType.threshold)
                window = triggerType.time_window.value
                content = content + "Posts about " + triggerType.follow.target.upper() + " has rised " + threshold + "% in the last " + window + "<br>"
            content = content + "<br><p>Sincerely,</p>Şurup Team"
            msg = Message(subject, recipients=[email])
            msg.html = content
            self.mail.send(msg)

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        mailer = Mailer(app)
        triggers = db.session.query(Trigger).all()
        mailer.deploy_mails(triggers)
    # app.run(debug=True)
