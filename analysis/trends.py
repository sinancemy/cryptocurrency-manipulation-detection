import pandas as pd
from data.market.yahoo import *
import matplotlib.pyplot as plt
from data.misc.misc import TimeRange


def _simple_moving_average(df, avg_time):
    sma = pd.DataFrame()
    sma[str(avg_time) + "SMA"] = df.iloc[:, 0].rolling(window=avg_time).mean()
    return sma


def _exponential_moving_average(df, avg_time):
    ema = pd.DataFrame()
    ema[str(avg_time) + "EMA"] = df.iloc[:, 0].ewm(span=avg_time, adjust=False).mean()
    return ema


def _slope(df, time_range):
    return (df.loc[time_range.high, :][0] - df.loc[time_range.low, :][0]) \
           / (time_range.high - time_range.low) * (df.index[1] - df.index[0])


# TODO: Implement: 8EMA, 13SMA, 21SMA, 55SMA
def analyze_trends(price_list):
    ema8, sma13, sma21, sma55 = None
    return ema8, sma13, sma21, sma55


def _example():
    print("30SMA slope: ", _slope(_simple_moving_average(
        pull_coin_history("BTC", TimeRange(1609459200, 1614556800), "1h")[["Price"]], 30 * 24),  # 30 * 24 for 30 DAY
        TimeRange(1612008000, 1614556800)))
    print("10EMA slope: ", _slope(_exponential_moving_average(
        pull_coin_history("BTC", TimeRange(1611187200, 1612828800), "1h")[["Price"]], 10 * 24),  # 10 * 24 for 30 DAY
        TimeRange(1612008000, 1612828800)))

    plt.plot(pull_coin_history("BTC", TimeRange(1609459200, 1614556800), "1h")[["Price"]])
    plt.plot(_simple_moving_average(pull_coin_history("BTC", TimeRange(1609459200, 1614556800), "1h"), 30 * 24))
    plt.plot(_exponential_moving_average(pull_coin_history("BTC", TimeRange(1611187200, 1612828800), "1h"), 10 * 24))

    plt.show()


_example()
