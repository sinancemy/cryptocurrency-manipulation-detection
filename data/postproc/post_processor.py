import functools


class PostProcessor(object):
    def __init__(self, cleanup_rules=None, normalize_interaction=False, normalization_grouper=None):
        self.cleanup_rules = [] if cleanup_rules is None else cleanup_rules
        self.normalize_interaction = normalize_interaction
        self.normalization_grouper = normalization_grouper

    # Extend the iterator with the cleanup rules.
    def __cleaned(self, lst: iter):
        it = lst
        for rule in self.cleanup_rules:
            it = filter(rule, it)
        return it

    # Normalizes the interaction
    def __normalize_interaction(self, posts):
        groups = {}
        for post in posts:
            group = self.normalization_grouper(post)
            if group not in groups:
                groups[group] = []
            groups[group].append((post.unique_id, post.interaction))
        for group, posts in groups:
            group_min = min(posts, key=lambda p: p[1])
            group_max = max(posts, key=lambda p: p[1])
            for i in range(len(groups)):
                post_interaction = posts[i][1]
                normalized = (post_interaction - group_min) / (group_max - group_min)
                posts[i][1] = normalized
        # unique id -> normalized interaction
        dct = dict(functools.reduce(list.__add__, groups.values()))
        for post in posts:
            new_post = post.copy()
            new_post.interaction = dct[post.unique_id]
            yield new_post

    def post_process(self, posts):
        it = self.__cleaned(posts)
        if self.normalize_interaction:
            it = self.__normalize_interaction(it)
        return list(it)
