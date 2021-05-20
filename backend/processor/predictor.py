from statistics import mean

from tqdm import tqdm

from analysis.model import CryptoSpeculationModel
from analysis.operate import predict
from data.dataset import load_vectorizer_of, PredictSet
import torch
from data.database import Post, db
from misc import CoinType, TimeRange


class Predictor:

    def __init__(self, model_name, vectorizer_dataset_name):
        if torch.cuda.is_available():
            self.device = torch.device("cuda:0")
        else:
            self.device = torch.device("cpu")

        self.vectorizer = load_vectorizer_of(vectorizer_dataset_name)
        self.model = CryptoSpeculationModel(model_name, self.device, self.vectorizer)
        self.model.load()

    def set_device(self, device):
        self.device = device

    def predict(self, posts) -> iter:
        for impact in predict(self.model, PredictSet(posts, self.vectorizer), self.device, 1024):
            yield impact


pred = Predictor("post2impact_v1_0", "Jun19_May21_Big")


def update_post_impacts(time_range: TimeRange, commit=True):
    posts = Post.query.filter(Post.time <= time_range.high).filter(Post.time >= time_range.low).all()
    for post, prediction in tqdm(zip(posts, pred.predict(posts)), "Updating predictions..."):
        post.impact = prediction.tobytes()
        post.avg_impact = mean(list(prediction))
    if commit:
        db.session.commit()


def _example():
    pred = Predictor("test_model", "Jun19_Feb21_Big")
    posts = [
        Post(coin_type=CoinType.btc, user="elonmusk", content="Everyone should be selling right now.", source="twitter",
             interaction=2114),
        Post(coin_type=CoinType.doge, user="some_guy", content="Everyone should be buying right now.",
             source="reddit/dogecoin", interaction=9)]
    for prediction in pred.predict(posts):
        print(prediction)


if __name__ == "__main__":
    _example()
