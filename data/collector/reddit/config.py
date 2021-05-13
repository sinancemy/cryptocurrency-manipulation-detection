from misc import CoinType

COIN_SUBREDDITS = {
    CoinType.btc: ["Bitcoin", "BTC"],
    CoinType.eth: ["Ethereum", "ETH"],
    CoinType.doge: ["Dogecoin"],
    CoinType.ada: ["cardano"],
    CoinType.link: ["chainlink"],
    CoinType.dot: ["polkadot"],
    CoinType.xrp: ["ripple", "xrp"],
    CoinType.ltc: ["litecoin", "ltc"],
    CoinType.xlm: ["stellar", "xlm"],
    CoinType.omg: ["omise_go", "omgnetwork"],
}
CLIENT_ID = '7PKSFWfDqgf_lA'
CLIENT_SECRET = '5BLHdTaIJQT680-ZwXo1jo3xIbLOJw'
USER_AGENT = 'Crawler for Cryptocurrency Analysis'
DEFAULT_PRAW_SUBMISSION_LIMIT = 10000


def calculate_interaction_score(num_comments, score):
    return num_comments + score
