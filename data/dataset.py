from torch.utils.data import Dataset


class SentimentDataset(Dataset):
    def __init__(self, name):
        self.name = name

    def __len__(self):
        pass

    def __getitem__(self, item):
        pass
