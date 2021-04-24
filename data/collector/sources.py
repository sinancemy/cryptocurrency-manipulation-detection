import functools
from typing import Optional

from data.collector.reddit import ArchivedRedditCrawler, RealtimeRedditCrawler
from data.collector.twitter import TwitterCrawler

CRAWLERS = [ArchivedRedditCrawler, RealtimeRedditCrawler, TwitterCrawler]


class Source:
    def __init__(self, source, username):
        self.username = username
        self.source = source

    def __repr__(self):
        return self.username + "@" + self.source


def expand_requested_source(req: str) -> list:
    parsed = parse_source(req)
    if parsed is None:
        return []
    return list(filter(lambda src: source_matches(src, parsed), get_all_sources()))


def source_matches(a: Source, b: Source) -> bool:
    if a.source != b.source:
        return False
    if a.username == "*" or b.username == "*":
        return True
    return a.username == b.username


def parse_source(source) -> Optional[Source]:
    parts = source.split("@")
    if len(parts) != 2:
        return None
    username, source = parts[0], parts[1]
    return Source(source, username)


def get_all_sources() -> list:
    sources = [c.get_all_sources() for c in CRAWLERS]
    sources_flat = functools.reduce(list.__add__, sources)
    sources_unique = set(sources_flat)
    sources_converted = map(parse_source, sources_unique)
    return list(sources_converted)


if __name__ == "__main__":
    print(expand_requested_source("*@twitter"))
    print(expand_requested_source("VitalikButerin@twitter"))
    print(expand_requested_source("Mermaid@twitter"))
    print(expand_requested_source("*@reddit/Bitcoin"))
    print(expand_requested_source("cabbar@reddit/Bitcoin"))
    print(expand_requested_source("cabbar@reddit/Habsburg"))
    print(expand_requested_source("*@reddit/Habsburg"))