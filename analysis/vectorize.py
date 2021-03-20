import string
import re
import numpy as np


# TODO: Add padding and adapt to NumPy.
class DiscreteDomain:
    def __init__(self, discrete_list, min_count_to_include, max_size, neg_list=[]):
        self.NEG = "<neg>"  # "Negligible" token

        counts = dict()
        for d in discrete_list:
            if d not in counts:
                counts[d] = 1
            else:
                counts[d] += 1

        self.d2i = {self.NEG: 0}
        self.i2d = [self.NEG]
        for i, d in enumerate(sorted(counts, key=counts.get, reverse=True)):
            if d not in neg_list and counts[d] >= min_count_to_include:
                self.d2i[d] = i + 1
                self.i2d.append(d)
            if len(self.d2i) == max_size:
                break

    def __len__(self):
        return len(self.d2i)

    def one_hot_encode(self, discrete):
        oh = np.zeros((len(self)))
        oh[self.d2i[discrete]] = 1
        return oh

    def one_hot_decode(self, oh):
        return self.i2d[oh.argmax()]


# TODO: Add padding and adapt to NumPy.
class Vocabulary:
    def __init__(self, sentences, max_vocab_size=10000, min_count_to_include=15, max_word_length=25):
        self.ALLOWED_CHAR_SET = set(string.ascii_lowercase + string.digits + string.punctuation)
        self.UNK = "<unk>"

        self.max_word_length = max_word_length
        word_counts = dict()
        for sentence in sentences:
            for word in tokenize(sentence, self.ALLOWED_CHAR_SET, max_token_length=self.max_word_length):
                if word not in word_counts:
                    word_counts[word] = 1
                else:
                    word_counts[word] += 1

        self.w2i = {self.UNK: 0}
        self.i2w = [self.UNK]
        for i, w in enumerate(sorted(word_counts, key=word_counts.get, reverse=True)):
            if word_counts[w] >= min_count_to_include:
                self.w2i[w] = i+1
                self.i2w.append(w)
            if len(self.w2i) == max_vocab_size:
                break

    def __len__(self):
        return len(self.w2i)

    def translate_encode(self, sentence_w):
        return [self.w2i.get(word, 0) for word in tokenize(sentence_w, max_token_length=self.max_word_length)]

    def translate_decode(self, sentence_i):
        return [self.i2w[idx] for idx in sentence_i]


def tokenize(sentence, allowed_char_set, max_token_length=25):
    tokens = list()
    for token in sentence.split():
        token = re.sub("[" + string.punctuation.replace("#", "") + "]", "", token.lower())
        if ((set(token).issubset(allowed_char_set)) and (len(token) <= max_token_length))\
                and ((token != "") and ("\\" not in token) and ("http" not in token)):
            tokens.append(token)
    return tokens
