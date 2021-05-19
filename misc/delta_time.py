def seconds(s: int) -> int:
    return s


def minutes(m: float) -> int:
    return int(m * 60)


def hours(h: float) -> int:
    return int(minutes(h * 60))


def days(d: float) -> int:
    return int(hours(d * 24))


def months(m: float) -> int:
    return int(days(m * 30))
