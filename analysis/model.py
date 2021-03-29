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
    def __init__(self, device, domain_sizes, embed_dims, lstm_length, lstm_hidden_dim, lstm_layers, fc_dims, out_dim,
                 batch_size, dropout=0.5):
        super().__init__()
        self.device = device
        self.batch_size = batch_size
        self.lstm_hidden_dim = lstm_hidden_dim
        self.lstm_layers = lstm_layers

        self.embed = nn.Embedding(domain_sizes[0], embed_dims[0])  # TODO: Initialize with pre-trained embeddings.
        self.lstm = nn.LSTM(embed_dims[0], self.lstm_hidden_dim, num_layers=lstm_layers, bidirectional=False,
                            dropout=dropout, batch_first=True)  # TODO: Try Convs.
        lstm_out_dim = int(lstm_hidden_dim * lstm_length / 8)
        print(lstm_out_dim)
        self.reduce = nn.Sequential(*[nn.Linear(lstm_hidden_dim * lstm_length * 1, lstm_out_dim), nn.ReLU()])

        self.user_embed = nn.Sequential(*[nn.Linear(domain_sizes[1], embed_dims[1]), nn.ReLU()])
        self.source_embed = nn.Sequential(*[nn.Linear(domain_sizes[2], embed_dims[2]), nn.ReLU()])

        fc_dims.insert(0, lstm_out_dim + embed_dims[1] + embed_dims[2] + 1)
        fc_layers = []
        for i in range(0, len(fc_dims) - 1):
            fc_layers += [nn.BatchNorm1d(fc_dims[i]),
                          nn.Linear(fc_dims[i], fc_dims[i + 1]),
                          nn.Dropout(dropout),
                          nn.ReLU()]

        self.fc = nn.Sequential(*fc_layers)
        self.out = nn.Linear(fc_dims[-1], out_dim)

        self.lstm_hidden = self.lstm_cell = None
        self.reset_lstm_inputs()

    def reset_lstm_inputs(self):
        self.lstm_hidden = Variable(
            torch.zeros(self.lstm_layers * 1, self.batch_size, self.lstm_hidden_dim).to(self.device))
        self.lstm_cell = Variable(
            torch.zeros(self.lstm_layers * 1, self.batch_size, self.lstm_hidden_dim).to(self.device))

    def forward(self, x_content, x_user, x_source, x_interaction):
        x_embed = self.embed(x_content)
        x_lstm, (self.lstm_hidden, self.lstm_cell) = self.lstm(x_embed, (self.lstm_hidden, self.lstm_cell))
        x_semantic = self.reduce(torch.flatten(x_lstm, start_dim=1))

        x = torch.cat((x_semantic, self.user_embed(x_user), self.source_embed(x_source), x_interaction), dim=1)
        x = self.fc(x)
        return self.out(x)

    def to(self, device):
        super().to(device)
        self.device = device
