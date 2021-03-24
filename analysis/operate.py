from data.dataset import CryptoSpeculationDataset
from analysis.model import CryptoSpeculationModel


def train(model, dataset, epochs, batch_size, lr):
    pass


EPOCHS = 8
BATCH_SIZE = 64
LR = 2e-4

dataset = CryptoSpeculationDataset("sample_set_2020_2021")

VOCAB_SIZE = len(dataset.vectorizer.v)
EMBED_DIM = 32
LSTM_HIDDEN_DIM = 64
FC_DIMS = [(dataset.vectorizer.v.max_sentence_length + len(dataset.vectorizer.u) + len(dataset.vectorizer.s) + 1),
           1024, 512, 256]
OUT_DIM = 4

model = CryptoSpeculationModel(len(dataset.vectorizer.v), EMBED_DIM, LSTM_HIDDEN_DIM, FC_DIMS, OUT_DIM, BATCH_SIZE)

train(model, dataset, EPOCHS, BATCH_SIZE, LR)
