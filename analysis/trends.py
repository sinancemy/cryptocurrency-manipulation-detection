import pandas as pd
from data.market.yahoo import *
import matplotlib.pyplot as plt
from data.misc.misc import TimeRange
from data.datacollector import *
from data.social_media.reddit import RedditCrawler
from data.social_media.twitter import TwitterCrawler


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
    coin = price_list[0].coin_type
    df = pd.DataFrame([price.price for price in price_list], index=[price.time for price in price_list])

    ema8 = _slope(_exponential_moving_average(moving_average_time(df, 8), 8), slope_time(df, 8))
    sma13 = _slope(_simple_moving_average(moving_average_time(df, 13), 13), slope_time(df, 13))
    sma21 = _slope(_simple_moving_average(moving_average_time(df, 21), 21), slope_time(df, 21))
    sma55 = _slope(_simple_moving_average(moving_average_time(df, 55), 55), slope_time(df, 55))

    return ema8, sma13, sma21, sma55


def moving_average_time(df, time_range):
    start = round(((df.index[0] + df.index[-1])/2)/(60 * 60)) * (60 * 60) - time_range * 60 * 60 * 24
    end = round(((df.index[0] + df.index[-1])/2)/(60 * 60)) * (60 * 60) + time_range * 60 * 60 * 24
    return df.loc[start:end]


def slope_time(df, time_range):
    middle = round(((df.index[0] + df.index[-1])/2)/(60 * 60)) * (60 * 60)
    end = middle + time_range * 60 * 60 * 24
    return TimeRange(middle, end)


def _example():
    print(analyze_trends(pull_coin_history_as_models(CoinType.BTC, TimeRange(1577836800, 1587340800), "1h")))
    plt.plot(pull_coin_history(CoinType.BTC, TimeRange(1577836800, 1587340800), "1h")[["Price"]])
    plt.plot(
        _exponential_moving_average(pull_coin_history(CoinType.BTC, TimeRange(1577836800, 1587340800), "1h"), 8 * 24))
    plt.plot(_simple_moving_average(pull_coin_history(CoinType.BTC, TimeRange(1577836800, 1587340800), "1h"), 13 * 24))
    plt.plot(_simple_moving_average(pull_coin_history(CoinType.BTC, TimeRange(1577836800, 1587340800), "1h"), 21 * 24))
    plt.plot(_simple_moving_average(pull_coin_history(CoinType.BTC, TimeRange(1577836800, 1587340800), "1h"), 55 * 24))
    plt.show()


_example()
