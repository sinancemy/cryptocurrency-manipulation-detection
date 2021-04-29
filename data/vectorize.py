import string
import re
import numpy as np
import zlib


# TODO: Documentation


class DiscreteDomain:
    def __init__(self, discrete_list, max_size=100, min_count_to_include=1, include_list=[], neg_list=[]):
        self.NEG = "<neg>"  # "Negligible" token

        counts = dict()
        for w in discrete_list:
            if w not in counts:
                counts[w] = 1
            else:
                counts[w] += 1
        self.w2i = {self.NEG: 1}
        self.i2w = [self.NEG]

        for w in include_list:
            try:
                counts.pop(w)
            except KeyError:
                continue
            self.w2i[w] = len(self.i2w) + 1
            self.i2w.append(w)
        for w in sorted(counts, key=counts.get, reverse=True):
            if w not in neg_list and counts[w] >= min_count_to_include:
                self.w2i[w] = len(self.i2w) + 1
                self.i2w.append(w)  # [0] reserved for NEG -> 1, [1] -> 2
            if len(self) == max_size:
                break

    def __len__(self):
        return len(self.i2w)

    def vectorize(self, discrete):
        oh = np.zeros((len(self)), dtype=int)
        oh[self.w2i.get(discrete, 1) - 1] = 1
        return oh

    def devectorize(self, oh):
        return self.i2w[oh.argmax()]

    def serialize(self):
        return [self.w2i, self.i2w]

    def deserialize(self, serial):
        self.w2i = serial[0]
        self.i2w = serial[1]


class Vocabulary(DiscreteDomain):
    def __init__(self, sentences, max_vocab_size=10000, min_count_to_include=15,
                 sentence_length_range=(0, 128), max_word_length=25):
        self.ALLOWED_CHAR_SET = set(string.ascii_lowercase + string.digits + string.punctuation)
        self.UNK = "<unk>"
        self.min_sentence_length = sentence_length_range[0]
        self.max_sentence_length = sentence_length_range[1]
        self.max_word_length = max_word_length
        word_counts = dict()
        for sentence in sentences:
            for i, word in enumerate(tokenize(sentence, self.ALLOWED_CHAR_SET, max_token_length=self.max_word_length)):
                if word not in word_counts:
                    word_counts[word] = 1
                else:
                    word_counts[word] += 1

        self.w2i = {self.UNK: 1}
        self.i2w = [self.UNK]
        for i, w in enumerate(sorted(word_counts, key=word_counts.get, reverse=True)):
            if word_counts[w] >= min_count_to_include:
                self.w2i[w] = len(self) + 1
                self.i2w.append(w)
            if len(self.w2i) == max_vocab_size:
                break

    def __len__(self):
        return len(self.w2i)

    def vectorize(self, sentence_w):
        vec = np.zeros(self.max_sentence_length, dtype=int)
        tok = tokenize(sentence_w, self.ALLOWED_CHAR_SET, self.max_word_length)
        if len(tok) < self.min_sentence_length:
            return None
        for i, word in enumerate(tok):
            if i == self.max_sentence_length:
                break
            vec[i] = self.w2i.get(word, 1)
        return vec

    def devectorize(self, sentence_i):
        return np.array([self.i2w[idx] for idx in sentence_i])

    def serialize(self):
        return super().serialize() + [self.min_sentence_length, self.max_sentence_length, self.max_word_length]

    def deserialize(self, serial):
        super().deserialize(serial[0:2])
        self.min_sentence_length = serial[2]
        self.max_sentence_length = serial[3]
        self.max_word_length = serial[4]


def tokenize(sentence, allowed_char_set, max_token_length=25):
    tokens = list()
    for token in sentence.split():
        token = re.sub("[" + string.punctuation.replace("#", "") + "]", "", token.lower())
        if ((set(token).issubset(allowed_char_set)) and (len(token) <= max_token_length)) \
                and ((token != "") and ("\\" not in token) and ("http" not in token)):
            tokens.append(token)
    return tokens


class Vectorizer:
    def __init__(self, *domains: DiscreteDomain):
        self.domains = domains

    def vectorize(self, *objs):
        return [domain.vectorize(objs[i]) for i, domain in enumerate(self.domains)]

    def domain_sizes(self):
        return [len(d) for d in self.domains]

    def save(self, save_dir):
        data = zlib.compress(
            [domain.serialize() + [domain.__class__.__name__] for domain in self.domains].__repr__().encode())
        save_file = open(save_dir, "wb")
        save_file.write(data)

    def load(self, load_dir):
        load_file = open(load_dir, "rb")
        data = load_file.read()
        decompressed = zlib.decompress(data).decode()
        data = eval(zlib.decompress(data).decode())
        self.domains = list()
        for domain_data in data:
            domain = globals()[domain_data[-1]]([])
            domain.deserialize(domain_data[0:-1])
            self.domains.append(domain)
