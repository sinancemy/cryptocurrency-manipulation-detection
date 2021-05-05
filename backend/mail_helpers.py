from flask_mail import Mail, Message


class Mailer:
    def __init__(self, app):
        app.config['MAIL_SERVER'] = 'smtp.gmail.com'
        app.config['MAIL_PORT'] = 465
        app.config['MAIL_USE_TLS'] = False
        app.config['MAIL_USE_SSL'] = True
        app.config['MAIL_USERNAME'] = 'utkns09@gmail.com'
        app.config['MAIL_PASSWORD'] = 'xyz'
        app.config['MAIL_DEFAULT_SENDER'] = 'utkns09@gmail.com'
        self.mail = Mail(app)

    def send_mail(self):
        msg = Message("Selam", sender="utkns09@gmail.com", recipients=["hsahin17@ku.edu.tr"])
        msg.body = "Hi"
        self.mail.send(msg)
