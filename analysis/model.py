import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.autograd import Variable


class CryptoSpeculationModel(nn.Module):
    def __init__(self, vocab_size, embed_dim, lstm_hidden_dim, fc_dims, out_dim, batch_size, dropout=0.5):
        super(self)
        self.batch_size = batch_size

        self.embed = nn.Embedding(vocab_size, embed_dim)  # TODO: Initialize with pre-trained embeddings.
        self.lstm = nn.LSTM(embed_dim, lstm_hidden_dim, dropout=dropout)
        fc_layers = []
        for i in range(0, len(fc_dims) - 1):
            fc_layers += [nn.Linear(fc_dims[i], fc_dims[i + 1]),
                          nn.ReLU()]  # TODO: Try Swish!
        self.fc = nn.Sequential(*fc_layers)
        self.out = nn.Linear(fc_dims[-1], out_dim)

        self.lstm_hidden = Variable(torch.zeros(1, batch_size, lstm_hidden_dim).cuda())  # TODO: Verify shape.

    def forward(self, x_content, x_user, x_source, x_interaction):
        x_semantic, self.lstm_hidden = self.lstm(self.embed(x_content).view(len(x_content), self.batch_size, -1),
                                                 self.lstm_hidden)
        x = torch.cat((F.sigmoid(x_semantic), x_user, x_source, x_interaction), dim=1)  # TODO: Maybe dim=0 ?
        x = self.fc(x)
        return self.out(x)
