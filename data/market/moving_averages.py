import pandas as pd

price = {'Price': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
df = pd.DataFrame(price)


def simple_moving_average(df, time):
    df[str(time) + " Day Simple Moving Average"] = df.iloc[:, 0].rolling(window=time).mean()


def exponential_moving_average(df, time):
    df[str(time) + " Day Exponential Moving Average"] = df.iloc[:, 0].ewm(span=time, adjust=False).mean()


print(df)
simple_moving_average(df, 3)
print(df)
exponential_moving_average(df, 5)
print(df)
