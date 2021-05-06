import hashlib
import secrets


def verify_password(given: str, hash: str, salt: str) -> bool:
    return hash == hashlib.sha256(str(given + salt).encode("utf-8")).hexdigest()


# Returns hash, salt.
def new_password(password: str) -> (str, str):
    salt = secrets.token_hex(8)
    return hashlib.sha256(str(password + salt).encode("utf-8")).hexdigest(), salt