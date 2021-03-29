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

    # for epoch in tqdm(range(epochs)):
    for epoch in range(epochs):
        model.train()
        training_loss = 0
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

            training_loss += loss.item()

        training_loss /= i

        # for p in zip(prediction, true):
        #     print("____________________")
        #     print("Pred:", p[0].cpu().detach().numpy())
        #     print("True:", p[1].cpu().detach().numpy())

        model.eval()
        eval_loss = 0
        with torch.no_grad():
            for i, batch in enumerate(test_loader):
                content, user, source, interaction, impact = batch

                model.batch_size = content.shape[0]
                model.reset_lstm_inputs()

                prediction = model(Variable(content).to(device), Variable(user).to(device),
                                   Variable(source).to(device), Variable(interaction).to(device))
                true = Variable(impact).to(device)
                loss = loss_function(prediction, true)

                eval_loss += loss.item()
            eval_loss /= i

        print(f'Epoch {epoch+1}: Training Loss: {training_loss:.4f}, Eval Loss: {eval_loss: .4f}')


if torch.cuda.is_available():
    device = torch.device("cuda:0")
else:
    device = torch.device("cpu")

EPOCHS = 100
BATCH_SIZE = 2048
LR = 1e-3

dataset = CryptoSpeculationDataset("Jun19_Feb21_Big")

DOMAIN_SIZES = [len(dataset.vectorizer.domains[0]) + 1, len(dataset.vectorizer.domains[1]), len(dataset.vectorizer.domains[2])]  # TODO: Add <pad> token for padding sentences.
EMBED_DIMS = [64, 16, 8]
LSTM_LENGTH = dataset.vectorizer.domains[0].max_sentence_length
LSTM_HIDDEN_DIM = 16
LSTM_LAYERS = 2
FC_DIMS = [512, 128, 32]
OUT_DIM = 4

model = CryptoSpeculationModel(device, DOMAIN_SIZES, EMBED_DIMS, LSTM_LENGTH, LSTM_HIDDEN_DIM, LSTM_LAYERS, FC_DIMS, OUT_DIM, BATCH_SIZE,dropout=0.5)

train(model, dataset, device, EPOCHS, BATCH_SIZE, LR)
