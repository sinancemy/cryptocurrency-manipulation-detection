# Preliminary Research Report

## 1. Sentiment Analysis
For sentiment analysis, we have found that [VADER](https://github.com/cjhutto/vaderSentiment) is an acceptable base NLP model for our purposes, however we aim to develop and train our own model as well and use VADER only as a baseline for its performance. If, however, VADER achieves better accuracy than our model, we will opt to use it.

## 2. Market Prediction
We aim to predict the future trend of a coin through a regression method, which when given the output of the sentiment analysis of posts along with the meta data (poster, interaction, etc.) belonging to the posts, will predict the impact it will have on relevant coin(s) as a rational number correlated with the predicted trend.

## 3. Database Considerations
As it stands, we need to make a selection between two major database solutions: NoSQL and SQL. For storing social media posts and caching cryptocurrency trends, NoSQL seems to be a better choice since we will need to store large chunks of data and performance will be of utmost importance. However, we will also need to keep track of registered users, and the coins that they follow. For this, a relational database seems more appropriate. 

## 4. Frontend Design
We aim to provide a modern and interactive frontend. Thankfully, there are large number of frameworks and libraries that will allow us to 
