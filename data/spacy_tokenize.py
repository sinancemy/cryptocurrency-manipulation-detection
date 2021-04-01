import spacy
from spacy.tokenizer import Tokenizer


def spacy_tokenize(sentence, max_token_length=25):
    nlp = spacy.load("en_core_web_sm", disable=["tagger", "attribute_ruler", "lemmatizer"])
    tknz = Tokenizer(nlp.vocab)
    tokens = tknz(sentence)
    return list(filter(lambda t: len(t) <= max_token_length, map(lambda t: t.lower_, tokens)))
