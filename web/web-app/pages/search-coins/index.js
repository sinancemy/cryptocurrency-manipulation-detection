import { useCallback, useEffect, useRef, useState } from "react";
import { DashboardPanel } from "../../components/DashboardPanel";
import { CoinOverview } from "../../components/CoinOverview";
import { FollowButton } from "../../components/FollowButton";
import { useApiData } from "../../api-hook"
import { useRequireLogin, useUser } from "../../user-hook"

export default function SearchCoins() {
  useRequireLogin()
  const { user, isFollowingCoin } = useUser()
  const [query, setQuery] = useState("");
  const coins = useApiData([], "coin_list")
  const [filteredCoins, setFilteredCoins] = useState([]);

  useEffect(() => {
    if (!query || query.trim() === "") {
      const rearranged = [...coins.filter(c => isFollowingCoin(c.name)), ...coins.filter(c => !isFollowingCoin(c.name))]
      setFilteredCoins(rearranged)
      return
    }
    const filtered = coins.filter((coin) => coin.name.toLowerCase().includes(query.toLowerCase()))
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
    setFilteredCoins(sorted)
  }, [coins, query, user])

  return (
    <div className="grid grid-cols-3 mt-3 animate-fade-in-down">
      <div className="col-start-2">
        <DashboardPanel collapsable={false} restrictedHeight={true} headerDivisior={true}>
          <DashboardPanel.Header>
            <h1 className="font-bold text-center text-2xl mt-4 mb-4">
              Search Coins
            </h1>
            <div className="col-start-2 grid grid-cols-12">
              <input
                className="col-start-2 col-end-12 mt-4 mb-4 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                type="text"
                value={query}
                onInput={(e) => setQuery(e.target.value)}
                placeholder="Type to search..."
              />
            </div>
          </DashboardPanel.Header>
          <DashboardPanel.Body>
              {filteredCoins.map(coin => (
                <div className="mb-2">
                  <CoinOverview 
                    isSelected={() => true}
                    setSelected={() => true}
                    coin={coin.name}
                    button={(
                      <FollowButton
                        params={{type: coin.name}}
                        isFollowing={() => isFollowingCoin(coin.name)} />
                    )}/>
                </div>
              ))}
          </DashboardPanel.Body>
        </DashboardPanel>
      </div>
    </div>
  );
}
