import matplotlib.pyplot as plt
import yfinance as yf
from datetime import datetime, timedelta


def pull_coin_price(coin, start, end, resolution):
    """
    :param coin: The common abbreviation of the requested coin as a string.
    :param start: "datetime" object indicating the starting point of the requested data interval.
    :param end: "datetime" object indicating the ending point of the requested data interval.
    :param resolution: The temporal resolution of the requested data interval. Should be a string s such that:
    s ∈ {"1m", "2m", "5m", "15m", "30m", "60m", "90m", "1d", "5d", "1wk", "1mo", "3mo"}

    :return: Pandas DataFrame of the price of "coin" from "start" to "end" with "resolution" steps in time.
    """

    resolution = "60m" if resolution == "1h" else resolution
    end += timedelta(days=1)
    hist = yf.Ticker("%s-USD" % coin).history(interval=resolution,
                                              start=start.strftime("%Y-%m-%d"),
                                              end=end.strftime("%Y-%m-%d"))
    try:
        return hist.tz_convert(None)[start:end]
    except TypeError:
        return hist[start:end]


def _example_pull_request():
    coin = "DOGE"
    start = datetime(2017, 6, 14, 11, 0, 0)
    end = datetime(2021, 3, 7, 2, 0, 0)
    resolution = "1d"
    plt.plot(list(pull_coin_price(coin, start, end, resolution)["Open"]))
    plt.show()
