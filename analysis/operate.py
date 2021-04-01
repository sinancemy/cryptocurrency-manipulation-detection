import torch
import torch.optim as optim
import torch.nn as nn
from tqdm import tqdm
import matplotlib.pyplot as plt

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

    losses = ([], [])
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
        losses[0].append(training_loss)

        # for p in zip(prediction, true):
        #     print("____________________")
        #     print("Pred:", p[0].cpu().detach().numpy())
        #     print("True:", p[1].cpu().detach().numpy())

        model.eval()
        test_loss = 0
        with torch.no_grad():
            for i, batch in enumerate(test_loader):
                content, user, source, interaction, impact = batch

                model.batch_size = content.shape[0]
                model.reset_lstm_inputs()

                prediction = model(Variable(content).to(device), Variable(user).to(device),
                                   Variable(source).to(device), Variable(interaction).to(device))
                true = Variable(impact).to(device)
                loss = loss_function(prediction, true)

                test_loss += loss.item()
            test_loss /= i
            losses[1].append(test_loss)

        # for p in zip(prediction, true):
        #     print("____________________")
        #     print("Pred:", p[0].cpu().detach().numpy())
        #     print("True:", p[1].cpu().detach().numpy())

        print(f'Epoch {epoch+1}: Training Loss: {training_loss:.4f}, Testing Loss: {test_loss: .4f}')
    plt.plot(losses[0])
    plt.plot(losses[1])
    plt.show()


if torch.cuda.is_available():
    device = torch.device("cuda:0")
else:
    device = torch.device("cpu")

EPOCHS = 250
BATCH_SIZE = 3000
LR = 2e-3

dataset = CryptoSpeculationDataset("Jun19_Feb21_Big")
print(dataset)

DOMAIN_SIZES = [len(dataset.vectorizer.domains[0]) + 1, len(dataset.vectorizer.domains[1]),
                len(dataset.vectorizer.domains[2]), len(dataset.vectorizer.domains[3])]
EMBED_DIMS = [72, 32, 8, 4]
LSTM_LENGTH = dataset.vectorizer.domains[0].max_sentence_length
LSTM_HIDDEN_DIM = 32
LSTM_LAYERS = 4
FC_DIMS = [512, 128, 32]
OUT_DIM = 4

model = CryptoSpeculationModel(device, DOMAIN_SIZES, EMBED_DIMS, LSTM_LENGTH, LSTM_HIDDEN_DIM, LSTM_LAYERS, FC_DIMS, OUT_DIM, BATCH_SIZE, dropout=0.65)

train(model, dataset, device, EPOCHS, BATCH_SIZE, LR)
