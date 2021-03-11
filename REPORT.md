# Preliminary Research Report
This preliminary research report outlines the tools that we are planning to use in this project. 
## 1. Sentiment Analysis
For sentiment analysis, we have found that [VADER](https://github.com/cjhutto/vaderSentiment) is an acceptable base NLP model for our purpose, however we aim to develop and train our own model as well and use VADER as a baseline for its performance. If, however, VADER achieves better accuracy than our model, we will opt to use it. Furthermore, we will consider using [Spacy]() and [NLTK]() NLP libraries that provide sentimnent analysis tools to get the best results.

## 2. Market Prediction
We aim to predict the future trend of a coin through a regression method, which when given the output of the sentiment analysis of posts along with the metadata (poster, interaction, etc.) belonging to the posts, will predict the impact it will have on relevant coin(s) as a rational number correlated with the predicted trend. For linear regression, we plan to use [SKLearn]() library.
## 3. Infrastructure
We will primarily use Python language for our infrastructure.
### Framework
As our web framework, we will be using [Flask]() which is a "micro" framework for building web applications with Python. We have chosen Flask because it is simple and functional enough for our needs.
### User Management
Maintaining user accounts and ensuring their security is a difficult task. As outlined in our proposal, which cryptocurrencies a user is following should be considered as sensitive information. To ensure the privacy and security of our users, we will be using third party authentication solutions. At this point, we only aim to provide Google log-in option, which can be integrated in a Flask project using [AuthLib]().
### Database Considerations
We will use a database for storing user information, for saving the social media posts, and for caching market prices. For this reason, we will need a solution that can handle both read and write operations of large amounts of data with high performance. Fortunately, current relational database solutions are fit for our needs. Although we had considered NoSQL solutions, we will be keeping our data in a structured manner, and thus, we opted for SQL. We will initially use [SQLite]() for prototyping, paying extra attention to write the modules such that they can be used with other relational databases in the future. Once we start working with the backend, we will consider switching to [PostgreSQL]() for its high performance. Fortunately, Python has libraries that can allows easy communication with SQLite and PostgreSQL.

## 4. Frontend Design
We aim to provide a modern and interactive frontend. Thankfully, there are large number of frameworks and libraries that will allow us to achieve our goal. We are currently planning on using [Figma]() for wireframing, [Bootstrap]() for the styling, and [Vue.js]() as the framework. These choices can be changed in the future. But for now, they seem more than sufficient for our needs.
