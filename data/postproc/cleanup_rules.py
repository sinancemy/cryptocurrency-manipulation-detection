def remove_reddit_comments_rule(post):
    return "rc_" not in post.unique_id


def keep_keywords_rule(keywords):
    return lambda post: any(kw in post.content for kw in keywords)


def remove_short(min_chars):
    return lambda post: len(post.content) >= min_chars
