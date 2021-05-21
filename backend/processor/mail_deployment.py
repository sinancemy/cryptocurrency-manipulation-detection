from flask_mail import Mail, Message

from data.database import User


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

    def send_trigger_mail(self, triggers: list):
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
                window = triggerType.time_window
                content = content + "Posts about " + triggerType.follow.target.upper() + " has rised " + threshold + "% in the last " + window + "<br>"
            content = content + "<br><p>Sincerely,</p>Şurup Team"
            msg = Message(subject, recipients=[email])
            msg.html = content
            print("Sending e-mail to " + email)
            self.mail.send(msg)

    def send_reset_mail(self, email: str, code: str):
        link = "http://localhost:3000/change-password?code=" + code
        user = User.query.filter(User.email == email).first()
        email = user.email
        subject = "Password Reset"
        content = "<h2>Dear " + user.username + ",</h2>" + "<p>Here is the link to reset your password: </p><br>" + link
        content = content + "<br><p>Sincerely,</p>Şurup Team"
        msg = Message(subject, recipients=[email])
        msg.html = content
        print("Sending e-mail to " + email)
        self.mail.send(msg)
