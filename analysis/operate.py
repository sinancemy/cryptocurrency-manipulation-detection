import torch
import torch.optim as optim
import torch.nn as nn
from tqdm import tqdm

from data.dataset import CryptoSpeculationDataset
from analysis.model import CryptoSpeculationModel
from torch.utils.data import DataLoader
from torch.autograd import Variable


def train(model, dataset, device, epochs, batch_size, lr):
    train_set, test_set = dataset.partition(0.9)
    train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True)
    test_loader = DataLoader(test_set, batch_size=batch_size, shuffle=True)

    optimizer = optim.SGD(model.parameters(), lr=lr)
    loss_function = nn.MSELoss()

    model.to(device)

    for epoch in tqdm(range(epochs), "Training Epoch"):
        model.train()
        for i, batch in enumerate(train_loader):
            content, user, source, interaction, impact = batch

            prediction = model(Variable(content).to(device), Variable(user).to(device),
                               Variable(source).to(device), Variable(interaction).to(device))
            loss = loss_function(prediction, Variable(impact).to(device))
            # print(loss)

        model.eval()


if torch.cuda.is_available():
    device = torch.device("cuda:0")
else:
    device = torch.device("cpu")

EPOCHS = 8
BATCH_SIZE = 8
LR = 2e-4

dataset = CryptoSpeculationDataset("sample_set_2020_2021")

VOCAB_SIZE = len(dataset.vectorizer.domains[0]) + 1  # TODO: Add <pad> token for padding sentences.
EMBED_DIM = 32
LSTM_HIDDEN_DIM = 64
FC_DIMS = [
    (dataset.vectorizer.domains[0].max_sentence_length * EMBED_DIM * 4 + len(dataset.vectorizer.domains[1]) + len(
        dataset.vectorizer.domains[2]) + 1), 1024, 512, 256]
OUT_DIM = 4

model = CryptoSpeculationModel(device, VOCAB_SIZE, EMBED_DIM, LSTM_HIDDEN_DIM, FC_DIMS, OUT_DIM,
                               BATCH_SIZE)

train(model, dataset, device, EPOCHS, BATCH_SIZE, LR)
