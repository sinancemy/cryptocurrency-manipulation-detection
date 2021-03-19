import pandas as pd
import matplotlib.pyplot as plt
from data.market.yahoo import *
from data.datacollector import *


def analyze_trends(price_list):
    """
    Given a list of MarketPrice's, returns EMA8, SMA13, SMA21, and SMA55 slope values after a trend analysis.

    :param price_list: A list of MarketPrice model objects, where the n/2-th price is the initial point of the
    time interval at interest (e.g. price of the coin at the time of the post). Price data before and after the
    n/2-th price are used for computing the averages, and a minimum of 55 days prior and 55 days posterior to it
    should be included in the list.
    :return: EMA8, SMA13, SMA21, SMA55 slopes of the given price_list centered at the middle of the list.
    """
    df = pd.DataFrame([price.price for price in price_list], index=[price.time for price in price_list])

    ema8 = _slope(_exponential_moving_average(_select_time_range(df, _get_time_window_range(df, 8, False)), 8),
                  _get_time_window_range(df, 8, True))
    sma13 = _slope(_simple_moving_average(_select_time_range(df, _get_time_window_range(df, 13, False)), 13),
                   _get_time_window_range(df, 13, True))
    sma21 = _slope(_simple_moving_average(_select_time_range(df, _get_time_window_range(df, 21, False)), 21),
                   _get_time_window_range(df, 21, True))
    sma55 = _slope(_simple_moving_average(_select_time_range(df, _get_time_window_range(df, 55, False)), 55),
                   _get_time_window_range(df, 55, True))

    return ema8, sma13, sma21, sma55


def _simple_moving_average(df, avg_time):
    sma = pd.DataFrame()
    sma[str(avg_time) + "SMA"] = df.iloc[:, 0].rolling(window=avg_time).mean()
    return sma


def _exponential_moving_average(df, avg_time):
    ema = pd.DataFrame()
    ema[str(avg_time) + "EMA"] = df.iloc[:, 0].ewm(span=avg_time, adjust=False).mean()
    return ema


def _slope(df, time_range):
    try:
        x2 = df.loc[time_range.high, :][0]
    except KeyError:
        time_range.high -= 60*60
        return _slope(df, time_range)
    try:
        x1 = df.loc[time_range.low, :][0]
    except KeyError:
        time_range.low -= 60*60
        return _slope(df, time_range)
    return (x2 - x1) / (time_range.high - time_range.low) * (df.index[1] - df.index[0])


def _select_time_range(df, time_range):
    return df.loc[time_range.low:time_range.high]


def _get_time_window_range(df, time_window, start_from_middle=False):
    start = round(((df.index[0] + df.index[-1]) / 2) / (60 * 60)) * (60 * 60) - time_window * 60 * 60 * 24 \
        if not start_from_middle else round(((df.index[0] + df.index[-1]) / 2) / (60 * 60)) * (60 * 60)
    end = round(((df.index[0] + df.index[-1]) / 2) / (60 * 60)) * (60 * 60) + time_window * 60 * 60 * 24
    return TimeRange(start, end)


def _example():
    """
    An example analyze_trends call for reference and debugging purposes.
    """
    ema8, sma13, sma21, sma55 = analyze_trends(
        pull_coin_history_as_models(CoinType.BTC, TimeRange(1577836800, 1587340800), "1h"))
    print("EMA8  Slope: ", ema8)
    print("SMA13 Slope: ", sma13)
    print("SMA21 Slope: ", sma21)
    print("SMA55 Slope: ", sma55)
    plt.plot(pull_coin_history(CoinType.BTC, TimeRange(1577836800, 1587340800), "1h")[["Price"]], label="BTC/USD")
    plt.plot(
        _exponential_moving_average(pull_coin_history(CoinType.BTC, TimeRange(1577836800, 1587340800), "1h"), 8 * 24),
        label="EMA8")
    plt.plot(_simple_moving_average(pull_coin_history(CoinType.BTC, TimeRange(1577836800, 1587340800), "1h"), 13 * 24),
             label="SMA13")
    plt.plot(_simple_moving_average(pull_coin_history(CoinType.BTC, TimeRange(1577836800, 1587340800), "1h"), 21 * 24),
             label="SMA21")
    plt.plot(_simple_moving_average(pull_coin_history(CoinType.BTC, TimeRange(1577836800, 1587340800), "1h"), 55 * 24),
             label="SMA55")
    plt.legend(loc='lower left', frameon=False)
    plt.show()

# _example()
