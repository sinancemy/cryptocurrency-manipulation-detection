import torch
from data.dataset import CryptoSpeculationDataset


class ContentLSTM(torch.nn.Module):
    def __init__(self):
        super(self)


class FCRegression(torch.nn.Module):
    def __init__(self):
        super(self)


class CryptoSpeculationModel(torch.nn.Module):
    def __init__(self):
        super(self)


dataset = CryptoSpeculationDataset("sample_set_2020_2021")

for p in dataset.data_points[0:5]:
    print(p, "\n")
print(dataset)
