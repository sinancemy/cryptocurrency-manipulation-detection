from analysis.model import CryptoSpeculationModel
from analysis.operate import predict
from data.dataset import load_vectorizer_of, PredictSet
import torch
from data.database.models import Post, CoinType


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

    def predict(self, posts):
        return predict(self.model, PredictSet(posts, self.vectorizer), self.device, 1024)


def _example():
    pred = Predictor("test_model", "Jun19_Feb21_Big")
    posts = [Post(CoinType.BTC, "elonmusk", "Everyone should be selling right now.", "twitter", 2114, None, None),
             Post(CoinType.DOGE, "some_guy", "Everyone should be buying right now.", "reddit/dogecoin", 9, None, None)]
    pred.predict(posts)


_example()
