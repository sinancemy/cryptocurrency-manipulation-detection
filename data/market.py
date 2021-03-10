import matplotlib.pyplot as plt
import yfinance as yf
from datetime import datetime, timedelta
import numpy as np


def pull_coin_history(coin, start, end, resolution):
    """
    :param coin: The common abbreviation of the requested coin as a string.
    :param start: datetime object or UNIX timestamp indicating the starting point of the requested data interval.
    :param end: datetime object or UNIX timestamp indicating the ending point of the requested data interval.
    :param resolution: The temporal resolution of the requested data interval. Should be a string s such that:
    s ∈ {"1m", "2m", "5m", "15m", "30m", "60m", "90m", "1d", "5d", "1wk", "1mo", "3mo"}

    :return: Pandas DataFrame of the history of "coin" from "start" to "end" with "resolution" steps in time.
    """

    # If start and/or end is given as UNIX timestamps, convert them to datetime objects.
    if not isinstance(start, datetime):
        start = datetime.fromtimestamp(start)
    if not isinstance(end, datetime):
        end = datetime.fromtimestamp(end)

    # If given resolution is "1h", change it to "60m" (because of a bug in yfinance).
    resolution = "60m" if resolution == "1h" else resolution

    # Extend the start and end dates by one day each
    # (as a workaround to yfinance not pulling some of the required data due to timezones)
    start -= timedelta(days=1)
    end += timedelta(days=1)

    # Pull data with yfinance.
    hist = yf.Ticker("%s-USD" % coin).history(interval=resolution,
                                              start=start.strftime("%Y-%m-%d"),
                                              end=end.strftime("%Y-%m-%d"))

    # Select only the required time-price points and zero out the GMT offsets if needed.
    try:
        hist = hist.tz_convert(None)[start:end]
    except TypeError:
        hist = hist[start:end]

    # Convert date/time data to UNIX timestamps.
    hist.index = hist.index.astype(np.int64) // 10**9
    hist.index.name = "Timestamp"

    return hist


def pull_coin_prices(coin, start, end, resolution):
    """
    Same parameters as pull_coin_history()

    :return: The "Open" (price at time) column of the pandas DataFrame pull_coin_history() returns.
    """
    return pull_coin_history(coin, start, end, resolution)[["Open"]]


def _example_pull_request():
    """
    An example pull request for reference and debugging purposes.
    """
    coin = "DOGE"
    start = datetime(2017, 6, 14, 11, 0, 0)     # or 1497398400
    end = datetime(2021, 3, 7, 2, 0, 0)         # or 1615075200
    resolution = "1d"
    plt.plot(list(pull_coin_prices(coin, start, end, resolution)["Open"]))
    plt.show()
