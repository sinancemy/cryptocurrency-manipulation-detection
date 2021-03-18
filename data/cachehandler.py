from data.misc.misc import TimeRange


class CacheHandler(object):
    def __init__(self, cached_ranges_generator):
        self.generator = cached_ranges_generator

    def find_ranges(self, range_type: str, requested_range: TimeRange) -> tuple:
        return self.__find_ranges_aux(self.generator(range_type), requested_range)

    def __find_ranges_aux(self, cached_ranges: list, requested_range: TimeRange) -> tuple:
        overlapping_cached_ranges = []
        excluded_ranges = []
        for cached_range in cached_ranges:
            remaining_ranges = self.__split_ranges(cached_range, requested_range)
            # If cached range encompasses the requested range, then simply use the cached range.
            if len(remaining_ranges) == 0:
                return [cached_range], []
            # If cached range is completely unrelated to the requested range, try the next one.
            if len(remaining_ranges) == 1 and remaining_ranges[0].equals(requested_range):
                continue
            # If the requested range was split by the cached range, first add the cached range, and then recurse
            # on the splits.
            overlapping_cached_ranges.append(cached_range)
            for split_range in remaining_ranges:
                res = self.__find_ranges_aux(cached_ranges, split_range)
                overlapping_cached_ranges += res[0]
                excluded_ranges += res[1]
            return overlapping_cached_ranges, excluded_ranges
        # If no encompassing cached range was found, nor were there any splits, simply return the requested
        # range.
        return [], [requested_range]

    # Returns the outstanding ranges after the given requested range is compared with the cached range.
    def __split_ranges(self, cached, requested):
        if requested.high <= cached.low or cached.high <= requested.low:
            return [requested]
        if cached.low <= requested.low and requested.high <= cached.high:
            return []
        if requested.low < cached.low and requested.high <= cached.high:
            return [TimeRange(requested.low, cached.low)]
        if cached.low <= requested.low and requested.high > cached.high:
            return [TimeRange(cached.high, requested.high)]
        # Split into two.
        if cached.low > requested.low and cached.high < requested.high:
            return [TimeRange(requested.low, cached.low), TimeRange(cached.high, requested.high)]
