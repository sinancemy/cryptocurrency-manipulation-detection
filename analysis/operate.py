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

    optimizer = optim.Adam(model.parameters(), lr=lr, betas=(0.5, 0.99))
    loss_function = nn.MSELoss()

    model.to(device)

    for epoch in tqdm(range(epochs)):
        model.train()
        torch.cuda.empty_cache()
        for i, batch in enumerate(train_loader):
            content, user, source, interaction, impact = batch

            model.zero_grad()
            model.batch_size = content.shape[0]
            model.reset_lstm_inputs()

            prediction = model(Variable(content).to(device), Variable(user).to(device),
                               Variable(source).to(device), Variable(interaction).to(device))

            true = Variable(impact).to(device)
            loss = loss_function(prediction, true)
            loss.backward()
            optimizer.step()

            # for p in zip(prediction, true):
            #     print(p)

        for p in zip(prediction, true):
            print("Pred:", p[0])
            print("True:", p[1])

        # model.eval()


if torch.cuda.is_available():
    device = torch.device("cuda:0")
else:
    device = torch.device("cpu")

torch.backends.cudnn.enabled = False

EPOCHS = 16
BATCH_SIZE = 1024
LR = 2e-4

dataset = CryptoSpeculationDataset("sample_set_2020_2021")

VOCAB_SIZE = len(dataset.vectorizer.domains[0]) + 1  # TODO: Add <pad> token for padding sentences.
EMBED_DIM = 64
LSTM_HIDDEN_DIM = 128
FC_DIMS = [
    (dataset.vectorizer.domains[0].max_sentence_length * LSTM_HIDDEN_DIM * 2 + len(dataset.vectorizer.domains[1]) + len(
        dataset.vectorizer.domains[2]) + 1), 4096, 512, 128]
OUT_DIM = 4

model = CryptoSpeculationModel(device, VOCAB_SIZE, EMBED_DIM, LSTM_HIDDEN_DIM, FC_DIMS, OUT_DIM, BATCH_SIZE)

train(model, dataset, device, EPOCHS, BATCH_SIZE, LR)
