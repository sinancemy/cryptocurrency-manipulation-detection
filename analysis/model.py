import os.path

import torch
import torch.nn as nn
from torch.autograd import Variable

from misc import chdir_to_main

chdir_to_main()
MODELS_DIR = "analysis/models"


class Swish(nn.Module):
    def __init__(self, beta):
        super(Swish, self).__init__()
        self.beta = beta

    def forward(self, x):
        return x * torch.sigmoid(self.beta * x)


class CryptoSpeculationModel(nn.Module):
    def __init__(self, name, device, vectorizer, embed_dims=[72, 32, 8, 4], lstm_hidden_dim=32, lstm_layers=2,
                 lstm_out_dim=1024, fc_dims=[512, 128, 32], out_dim=4, batch_size=1024, dropout=0.55):
        domain_sizes = vectorizer.domain_sizes()
        lstm_length = vectorizer.domains[0].max_sentence_length

        super().__init__()
        self.name = name
        self.device = device
        self.batch_size = batch_size
        self.lstm_hidden_dim = lstm_hidden_dim
        self.lstm_layers = lstm_layers
        self.embed = nn.Embedding(domain_sizes[0]+1, embed_dims[0])  # TODO: Initialize with pre-trained embeddings.
        self.lstm = nn.LSTM(embed_dims[0], self.lstm_hidden_dim, num_layers=lstm_layers, bidirectional=True,
                            dropout=dropout, batch_first=True)
        self.reduce = nn.Sequential(*[nn.Linear(lstm_hidden_dim * lstm_length * 2, lstm_out_dim), nn.ReLU()])

        self.user_embed = nn.Sequential(*[nn.Linear(domain_sizes[1], embed_dims[1]), nn.ReLU()])
        self.source_embed = nn.Sequential(*[nn.Linear(domain_sizes[2], embed_dims[2]), nn.ReLU()])
        self.coin_embed = nn.Sequential(*[nn.Linear(domain_sizes[3], embed_dims[3]), nn.ReLU()])

        fc_dims.insert(0, lstm_out_dim + embed_dims[1] + embed_dims[2] + 1)
        fc_layers = []
        for i in range(0, len(fc_dims) - 1):
            fc_layers += [
                nn.LayerNorm(fc_dims[i]),
                nn.Linear(fc_dims[i], fc_dims[i + 1]),
                nn.Dropout(dropout),
                nn.ReLU()]

        self.fc = nn.Sequential(*fc_layers)
        self.out = nn.Linear(fc_dims[-1], out_dim)

        self.lstm_hidden = self.lstm_cell = None
        self.reset_lstm_inputs()

    def reset_lstm_inputs(self):
        self.lstm_hidden = Variable(
            torch.zeros(self.lstm_layers * 2, self.batch_size, self.lstm_hidden_dim).to(self.device))
        self.lstm_cell = Variable(
            torch.zeros(self.lstm_layers * 2, self.batch_size, self.lstm_hidden_dim).to(self.device))

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

    def save(self):
        torch.save(self.state_dict(), os.path.join(MODELS_DIR, self.name + ".pt"))

    def load(self):
        self.load_state_dict(torch.load(os.path.join(MODELS_DIR, self.name + ".pt"), map_location=torch.device("cpu")))
