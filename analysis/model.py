import torch
import torch.nn as nn
from torch.autograd import Variable


class Swish(nn.Module):
    def __init__(self, beta):
        super(Swish, self).__init__()
        self.beta = beta

    def forward(self, x):
        return x * torch.sigmoid(self.beta * x)


class CryptoSpeculationModel(nn.Module):
    def __init__(self, device, vocab_size, embed_dim, lstm_hidden_dim, fc_dims, out_dim, batch_size, dropout=0.5):
        super().__init__()
        self.device = device
        self.batch_size = batch_size
        self.lstm_hidden_dim = lstm_hidden_dim

        self.embed = nn.Embedding(vocab_size, embed_dim)  # TODO: Initialize with pre-trained embeddings.
        self.lstm = nn.LSTM(embed_dim, self.lstm_hidden_dim, bidirectional=True, dropout=dropout)
        fc_layers = []
        for i in range(0, len(fc_dims) - 1):
            fc_layers += [nn.Linear(fc_dims[i], fc_dims[i + 1]),
                          Swish(0.75)]  # TODO: Try Swish!
        self.fc = nn.Sequential(*fc_layers)
        self.out = nn.Linear(fc_dims[-1], out_dim)

        self.lstm_hidden = self.lstm_cell = None
        self.reset_lstm_inputs()

    def reset_lstm_inputs(self):
        self.lstm_hidden = Variable(torch.zeros(2, self.batch_size, self.lstm_hidden_dim).to(self.device))
        self.lstm_cell = Variable(torch.zeros(2, self.batch_size, self.lstm_hidden_dim).to(self.device))

    def forward(self, x_content, x_user, x_source, x_interaction):
        x_embed = self.embed(x_content).view(x_content.shape[1], self.batch_size, -1)
        x_semantic, (self.lstm_hidden, self.lstm_cell) = self.lstm(x_embed, (self.lstm_hidden, self.lstm_cell))
        x = torch.cat((torch.sigmoid(x_semantic.view(self.batch_size, -1)), x_user, x_source, x_interaction), dim=1)
        x = self.fc(x)
        return self.out(x)

    def to(self, device):
        super().to(device)
        self.device = device
