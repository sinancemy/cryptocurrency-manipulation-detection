import matplotlib.pyplot as plt
import yfinance as yf
from datetime import datetime, timedelta
import numpy as np
import time

from data.collector import Collector
from data.database.models import MarketPrice

from misc import TimeRange, CoinType


class YahooPriceCrawler(Collector):
    def __init__(self, resolution: str, coin: CoinType = CoinType.BTC):
        super().__init__(coin=coin, resolution=resolution)

    def collect(self, time_range: TimeRange):
        return pull_coin_history_as_models(self.settings.coin, time_range, self.settings.resolution)


def pull_coin_history_as_models(coin, time_range, resolution):
    return (MarketPrice(coin_type=coin, price=row[1].Price, volume=row[1].Volume, time=row[0])
            for row in pull_coin_history(coin, time_range, resolution).iterrows())


def pull_coin_history(coin, time_range, resolution):
    """
    :param coin: The common abbreviation of the requested coin as a string.
    :param time_range: TimeRange object indicating the interval of the requested data.
    :param resolution: The temporal resolution of the requested data interval. Should be a string s such that:
    s ∈ {"1m", "2m", "5m", "15m", "30m", "60m", "90m", "1d", "5d", "1wk", "1mo", "3mo"}

    :return: Pandas DataFrame of the history of "coin" from "start" to "end" with "resolution" steps in time.
    """

    start, end = (time_range.low, time_range.high)

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

    # Pull data with yfinance. IMPORTANT: The coin identity is the uppercase value of the enum.
    hist = yf.Ticker("%s-USD" % coin.value.upper()).history(interval=resolution,
                                                    start=start.strftime("%Y-%m-%d"),
                                                    end=end.strftime("%Y-%m-%d"))

    # Select only the required time-price points and zero out the GMT offsets if needed.
    start += timedelta(hours=24+(time.timezone/3600))
    end -= timedelta(hours=24-(time.timezone/3600))
    try:
        hist = hist.tz_convert(None)[start:end]
    except TypeError:
        hist = hist[start:end]

    # Convert date/time data to UNIX timestamps.
    hist.index = hist.index.astype(np.int64) // 10 ** 9
    hist.index.name = "Timestamp"

    return hist[["Open", "Volume"]].rename(columns={"Open": "Price"})


def _example_pull_request():
    """
    An example pull request for reference and debugging purposes.
    """
    plt.plot(list(pull_coin_history(CoinType.DOGE, TimeRange(1497398400, 1614556800), "1d")["Price"]))
    plt.show()


# print(pull_coin_history(CoinType.BTC, TimeRange(1609459200, 1614556800), "1h"))

# Testing
# cr = YahooPriceCrawler()
# prices = cr.collect_prices(CoinType.ETH, TimeRange(time.time() - 100, time.time()), "1m")
# db = Database()
# db.create_prices(prices)
# prices_ = db.read_prices()
# print(prices_)
