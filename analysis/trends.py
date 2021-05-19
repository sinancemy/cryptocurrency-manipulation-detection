import pandas as pd
from data.collector.yahoo import *
from data.reader.datareader import *


def analyze_trends(price_list):
    """
    Given a list of MarketPrice's, returns EMA8, SMA13, SMA21, and SMA55 slope values after a trend analysis.

    :param price_list: A list of MarketPrice model objects, where the n/2-th price is the initial point of the
    time interval at interest (e.g. price of the coin at the time of the post). Price data before and after the
    n/2-th price are used for computing the averages, and a minimum of 55 days prior and 55 days posterior to it
    should be included in the list.
    :return: EMA8, SMA13, SMA21, SMA55 slopes of the given price_list centered at the middle of the list.
    """
    price_list = [(price.price, price.time) for price in price_list]
    df = pd.DataFrame([price[0] for price in price_list], index=[price[1] for price in price_list])

    try:
        ema8 = _slope(_exponential_moving_average(_select_time_range(df, _get_time_window_range(df, 1, False)), 1 * 24),
                      _get_time_window_range(df, 1, True))
        sma13 = _slope(_simple_moving_average(_select_time_range(df, _get_time_window_range(df, 3, False)), 3 * 24),
                       _get_time_window_range(df, 3, True))
        sma21 = _slope(_simple_moving_average(_select_time_range(df, _get_time_window_range(df, 5, False)), 5 * 24),
                       _get_time_window_range(df, 5, True))
        sma55 = _slope(_simple_moving_average(_select_time_range(df, _get_time_window_range(df, 14, False)), 14 * 24),
                       _get_time_window_range(df, 14, True))
    except Exception:
        return 0.0, 0.0, 0.0, 0.0

    if np.isnan(ema8):
        ema8 = 0.0
    if np.isnan(sma13):
        sma13 = 0.0
    if np.isnan(sma21):
        sma21 = 0.0
    if np.isnan(sma55):
        sma55 = 0.0

    return ema8, sma13, sma21, sma55


def _simple_moving_average(df, avg_time):
    sma = pd.DataFrame()
    sma[str(avg_time/24) + "SMA"] = df.iloc[:, 0].rolling(window=avg_time).mean()
    return sma


def _exponential_moving_average(df, avg_time):
    ema = pd.DataFrame()
    ema[str(avg_time/24) + "EMA"] = df.iloc[:, 0].ewm(span=avg_time, adjust=False).mean()
    return ema


def _slope(df, time_range):
    try:
        x2 = df.loc[time_range.high, :][0]
        x1 = df.loc[time_range.low, :][0]
        if np.isnan(x1):
            return _slope(df, TimeRange(time_range.low + 60*60, time_range.high))
        return (x2 - x1) / (time_range.high - time_range.low) * (df.index[1] - df.index[0])
    except KeyError:
        return _slope(df, TimeRange(time_range.low + 60*60, time_range.high - 60*60))


def _select_time_range(df, time_range):
    return df.loc[time_range.low:time_range.high]


def _get_time_window_range(df, time_window, start_from_middle=False):
    middle = round(((df.index[0] + df.index[-1]) / 2) / (60 * 60)) * (60 * 60)
    start = middle - 60 * 60 * 24 * time_window
    end = middle + 60 * 60 * 24 * time_window
    if start_from_middle:
        return TimeRange(middle, end)
    else:
        return TimeRange(start, end)


def _example():
    """
    An example analyze_trends call for reference and debugging purposes.
    """
    ema8, sma13, sma21, sma55 = analyze_trends(
        collect_history(CoinType.btc, TimeRange(1577836800, 1587340800), "1h"))
    print("EMA8  Slope: ", ema8)
    print("SMA13 Slope: ", sma13)
    print("SMA21 Slope: ", sma21)
    print("SMA55 Slope: ", sma55)
    plt.plot(pull_coin_history(CoinType.btc, TimeRange(1577836800, 1587340800), "1h")[["Price"]], label="BTC/USD")
    plt.plot(
        _exponential_moving_average(pull_coin_history(CoinType.btc, TimeRange(1577836800, 1587340800), "1h"), 1 * 24),
        label="EMA8")
    plt.plot(_simple_moving_average(pull_coin_history(CoinType.btc, TimeRange(1577836800, 1587340800), "1h"), 3 * 24),
             label="SMA13")
    plt.plot(_simple_moving_average(pull_coin_history(CoinType.btc, TimeRange(1577836800, 1587340800), "1h"), 5 * 24),
             label="SMA21")
    plt.plot(_simple_moving_average(pull_coin_history(CoinType.btc, TimeRange(1577836800, 1587340800), "1h"), 14 * 24),
             label="SMA55")
    plt.legend(loc='lower left', frameon=False)
    plt.show()
