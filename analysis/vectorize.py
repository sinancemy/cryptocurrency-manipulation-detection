import string
import re
import numpy as np


class PostVectorizer:
    def __init__(self, vocabulary, user_domain, source_domain):
        self.v = vocabulary
        self.u = user_domain
        self.s = source_domain

    def vectorize(self, post):
        return self.v.vectorize(post.content), self.u.vectorize(post.user),\
               self.s.vectorize(post.source), post.interaction


class DiscreteDomain:
    def __init__(self, discrete_list, max_size, min_count_to_include, neg_list=[]):
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

    def vectorize(self, discrete):
        oh = np.zeros((len(self)))
        oh[self.d2i.get(discrete, 0)] = 1
        return oh

    def unvectorize(self, oh):
        return self.i2d[oh.argmax()]


class Vocabulary(DiscreteDomain):
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

    def vectorize(self, sentence_w):
        return np.array([self.w2i.get(word, 0) for word in tokenize(sentence_w, self.ALLOWED_CHAR_SET,
                                                                    max_token_length=self.max_word_length)])

    def unvectorize(self, sentence_i):
        return np.array([self.i2w[idx] for idx in sentence_i])


def tokenize(sentence, allowed_char_set, max_token_length=25):
    tokens = list()
    for token in sentence.split():
        token = re.sub("[" + string.punctuation.replace("#", "") + "]", "", token.lower())
        if ((set(token).issubset(allowed_char_set)) and (len(token) <= max_token_length))\
                and ((token != "") and ("\\" not in token) and ("http" not in token)):
            tokens.append(token)
    return tokens
