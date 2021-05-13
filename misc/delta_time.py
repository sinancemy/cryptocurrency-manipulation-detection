def seconds(s: int) -> int:
    return s


def minutes(m: int) -> int:
    return m * 60


def hours(h: float) -> int:
    return int(h * (60 * 60))


def days(d: float) -> int:
    return int(d * (60 * 60 * 24))
