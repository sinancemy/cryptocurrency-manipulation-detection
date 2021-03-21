import string
import re
import numpy as np


class PostVectorizer:
    def __init__(self, vocabulary, user_domain, source_domain):
        self.v = vocabulary
        self.u = user_domain
        self.s = source_domain

    def vectorize(self, post):
        return self.v.vectorize(post.content), self.u.vectorize(post.user), \
               self.s.vectorize(post.source), post.interaction

    def save(self, save_dir):
        self.v.save(save_dir)
        self.u.save(save_dir)
        self.s.save(save_dir)

    def load(self, load_dir):
        self.v = Vocabulary([])
        self.u = DiscreteDomain([])
        self.s = DiscreteDomain([])
        self.v.load(load_dir)
        self.u.load(load_dir)
        self.s.load(load_dir)


class DiscreteDomain:
    def __init__(self, discrete_list, max_size=100, min_count_to_include=1, neg_list=[]):
        self.NEG = "<neg>"  # "Negligible" token

        counts = dict()
        for d in discrete_list:
            if d not in counts:
                counts[d] = 1
            else:
                counts[d] += 1

        self.w2i = {self.NEG: 0}
        self.i2w = [self.NEG]
        for i, d in enumerate(sorted(counts, key=counts.get, reverse=True)):
            if d not in neg_list and counts[d] >= min_count_to_include:
                self.w2i[d] = i + 1
                self.i2w.append(d)
            if len(self.w2i) == max_size:
                break

    def __len__(self):
        return len(self.w2i)

    def vectorize(self, discrete):
        oh = np.zeros((len(self)))
        oh[self.w2i.get(discrete, 0)] = 1
        return oh

    def devectorize(self, oh):
        return self.i2w[oh.argmax()]

    def save(self, save_dir):
        # TODO: Save w2i dictionary and i2w array
        pass

    def load(self, load_dir):
        # TODO: Load w2i dictionary and i2w array
        pass


class Vocabulary(DiscreteDomain):
    def __init__(self, sentences, max_vocab_size=10000, min_count_to_include=15,
                 sentence_length_range=(4, 128), max_word_length=25):
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

        self.w2i = {self.UNK: 0}
        self.i2w = [self.UNK]
        for i, w in enumerate(sorted(word_counts, key=word_counts.get, reverse=True)):
            if word_counts[w] >= min_count_to_include:
                self.w2i[w] = i + 1
                self.i2w.append(w)
            if len(self.w2i) == max_vocab_size:
                break

    def __len__(self):
        return len(self.w2i)

    def vectorize(self, sentence_w):
        vec = np.zeros(self.max_sentence_length)
        tok = tokenize(sentence_w, self.ALLOWED_CHAR_SET, self.max_word_length)
        if len(tok) < self.min_sentence_length:
            return None
        for i, word in enumerate(tok):
            if i == self.max_sentence_length:
                break
            vec[i] = self.w2i.get(word, 0)
        return vec

    def devectorize(self, sentence_i):
        return np.array([self.i2w[idx] for idx in sentence_i])


def tokenize(sentence, allowed_char_set, max_token_length=25):
    tokens = list()
    for token in sentence.split():
        token = re.sub("[" + string.punctuation.replace("#", "") + "]", "", token.lower())
        if ((set(token).issubset(allowed_char_set)) and (len(token) <= max_token_length)) \
                and ((token != "") and ("\\" not in token) and ("http" not in token)):
            tokens.append(token)
    return tokens
