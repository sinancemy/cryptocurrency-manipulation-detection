import functools
from typing import Optional

from data.collector.reddit.archived import ArchivedRedditCrawler
from data.collector.reddit.realtime import RealtimeRedditCrawler
from data.collector.reddit.multiplexer import RedditMultiplexedCrawler
from data.collector.twitter import TwitterCrawler

CRAWLERS = [RedditMultiplexedCrawler, ArchivedRedditCrawler, RealtimeRedditCrawler, TwitterCrawler]


class Source:
    def __init__(self, source, username):
        self.user = username
        self.source = source

    def __repr__(self):
        return self.user + "@" + self.source


# Checks whether the given source (req) corresponds to at least one supported source.
def is_valid_source(req: str) -> bool:
    # Search the requested source in all the sources that we support.
    search_result = find_in_all_sources(req)
    # Return true if and only if requested source corresponds to a source that we support.
    return len(search_result) > 0


def find_in_all_sources(req) -> list:
    parsed = parse_source(req)
    if parsed is None:
        return []
    # Search the requested source in all the sources that we support.
    search_result = list(filter(lambda src: source_matches(parsed, src), get_exported_sources()))
    return search_result


def source_matches(a: Source, b: Source) -> bool:
    if a.source != b.source:
        return False
    if a.user == "*" or b.user == "*":
        return True
    return a.user == b.user


def parse_source(source) -> Optional[Source]:
    parts = source.split("@")
    if len(parts) != 2:
        return None
    username, source = parts[0], parts[1]
    return Source(source, username)


def get_exported_sources() -> list:
    sources = [[s for s in c.get_all_sources()] for c in CRAWLERS]
    sources_flat = functools.reduce(list.__add__, sources)
    sources_unique = set(sources_flat)
    sources_converted = map(parse_source, sources_unique)
    return list(sources_converted)


if __name__ == "__main__":
    print(is_valid_source("*@twitter"))
    print(is_valid_source("VitalikButerin@twitter"))
    print(is_valid_source("Mermaid@twitter"))
    print(is_valid_source("*@reddit/Bitcoin"))
    print(is_valid_source("cabbar@reddit/Bitcoin"))
    print(is_valid_source("cabbar@reddit/Habsburg"))
    print(is_valid_source("*@reddit/Habsburg"))
