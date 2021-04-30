import axios from "axios";
import cookie from "cookie";
import { DashboardPanel } from "../../components/DashboardPanel"
import { SimpleDropdown } from "../../components/SimpleDropdown"
import { useCallback, useEffect, useRef, useState } from "react";
import { PostOverview } from "../../components/PostOverview"
import { CuteButton } from "../../components/CuteButton"
import { SourceCard } from "../../components/SourceCard"
import { SourceOverview } from "../../components/SourceOverview";
import { getCoinIcon } from "../../helpers";
import { FollowButton } from "../../components/FollowButton";
import { SimpleGraph } from "../../components/SimpleGraph"
import { withParentSize } from '@vx/responsive';
import { useRequireLogin, useUser } from "../../user-hook";
import { useApiData } from "../../api-hook";
import { useRouter } from "next/router";

export default function CoinInfo() {
  useRequireLogin()
  const router = useRouter()
  const coinName = router.query.coin
  const { user, isFollowingCoin } = useUser()
  const coinStats = useApiData(null, "coin_stats", { type: coinName }, [coinName, user], () => coinName != null)
  const prices = useApiData(null, "prices", {type: coinName}, [coinName], () => coinName != null, (coins) => coins?.reverse())
  const [selectedSources, setSelectedSources] = useState([])
  const [sortByOption, setSortByOption] = useState("interaction")
  const [sortOrderOption, setSortOrderOption] = useState("descending")
  // Will be dynamically updated depending on the selected sources.
  const posts = useApiData([], "posts", {
    source: selectedSources.join(";")
  }, [selectedSources], () => selectedSources != null && selectedSources.length > 0)
  const [sortedPosts, setSortedPosts] = useState([])

  useEffect(() => {
      if(posts === null || posts.length === 0) {
        setSortedPosts([])
        return
      }
      const sorter = (sortByOption === "time") ? (a, b) => a.time - b.time : 
                      (sortByOption === "interaction") ? (a, b) => a.interaction - b.interaction :
                                                          (a, b) => ('' + a.user).localeCompare(b.user)
      const sorted = [...posts].sort(sorter)
      if(sortOrderOption === "descending") {
        sorted.reverse()
      }
      setSortedPosts(sorted)
  }, [posts, sortOrderOption, sortByOption])

  useEffect(() => {
    if(!selectedSources || selectedSources.length == 0) {
      setSortedPosts([])
    }
  }, [selectedSources])

  const SimpleResponsiveGraph = withParentSize(SimpleGraph)

  return (!coinName ? "..." :
    <div className="animate-fade-in-down grid grid-cols-12 mt-2 gap-2">
      <div className="col-start-2 col-span-2">
        <DashboardPanel collapsable={false}>
          <DashboardPanel.Header>
            <div className="grid grid-cols-1 mt-2 place-items-center">
              <span className="text-4xl">{ getCoinIcon(coinName) }</span>
              <span className="mt-2">{coinName.toUpperCase()}</span>
              <span className="mt-2 font-light">
                {coinStats?.num_followers && coinStats.num_followers} Followers
              </span>
              <div className="mt-2">
                <FollowButton
                  followEndpoint={"follow_coin"}
                  params={{type: coinName}}
                  isFollowing={() => isFollowingCoin(coinName)} />
              </div>
            </div>
          </DashboardPanel.Header>
          <DashboardPanel.Body></DashboardPanel.Body>
        </DashboardPanel>
        <DashboardPanel collapsable={false}>
          <DashboardPanel.Header>
                Top Relevant Sources
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            { coinStats?.top_sources && coinStats.top_sources.length > 0 ? (
                coinStats.top_sources.map(source => (
                <div className="mt-2">
                  <SourceCard 
                    source={source.source}
                    isSelected={() => selectedSources.includes(source.source)}
                    onToggle={() => {
                      if(selectedSources.includes(source.source)) {
                        setSelectedSources(selectedSources.filter(x => x !== source.source))
                      } else {
                        setSelectedSources([...selectedSources, source.source])
                      }
                    }} />
                </div>
              ))
            ) : ("There are no sources.")}
          </DashboardPanel.Body>
          <DashboardPanel.Footer>
            <div className="flex flex-row">
              <CuteButton
                onClick={() => setSelectedSources(coinStats?.top_sources?.map(s => s.source))}
                disabled={() => coinStats?.top_sources == null || selectedSources.length === coinStats.top_sources.length}>
                Select all
              </CuteButton>
              <span className="flex-grow"></span>
              <CuteButton
                onClick={() => setSelectedSources([])}
                disabled={() => selectedSources.length === 0}>
                Unselect all
              </CuteButton>
              <span className="flex-grow"></span>
            </div>  
          </DashboardPanel.Footer>
        </DashboardPanel >
      </div>
      <div className="col-start-4 col-span-6">
        <div className="h-48 bg-gray-900 rounded-md overflow-hidden mb-2">
          {prices && coinStats?.last_price && coinStats && <SimpleResponsiveGraph
            stock={prices}
            lastPrice={coinStats.last_price.price}
          />}
        </div>
        <DashboardPanel collapsable={false} restrictedHeight={false}>
          <DashboardPanel.Header>
            <div className="flex flex-justify-between font-light">
              <span class="flex-grow"></span>
              <div className="flex">
                <div className="mr-2 px-2">
                  sort by {" "}
                    <SimpleDropdown 
                      options={['time', 'interaction', 'user']} 
                      selected={sortByOption} 
                      setSelected={setSortByOption} />
                    {" "} in <SimpleDropdown 
                      options={['ascending', 'descending']} 
                      selected={sortOrderOption} 
                      setSelected={setSortOrderOption} />
                      {" "} order
                </div>
              </div>
            </div>
          </DashboardPanel.Header>
          <DashboardPanel.Body>
          {sortedPosts.length > 0 ? (
            <div className="overflow-y-auto max-h-128">
              {sortedPosts.map((post, i) => (
                <PostOverview post={post} />
              ))}
            </div>
            ) : (
              <div className="mt-2">There aren't any posts about this coin.</div>
            )}
          </DashboardPanel.Body>
        </DashboardPanel>
      </div>
      <div className="col-start-10 col-span-2">
        <DashboardPanel collapsable={false}>
          <DashboardPanel.Header>
                Top Active Users
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            { coinStats?.top_active_users && coinStats.top_active_users.length > 0 ? (
                coinStats.top_active_users.map(user => (
                <div className="mt-2">
                  <SourceOverview 
                    source={user.source}
                    button={<>{user.total_msg}</>} 
                    singleLine={true} />
                </div>
              ))
            ) : ("There are no sources.")}
          </DashboardPanel.Body>
        </DashboardPanel>
        <DashboardPanel collapsable={false}>
          <DashboardPanel.Header>
                Top Interacted Users
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            { coinStats?.top_interacted_users && coinStats.top_interacted_users.length > 0 ? (
                coinStats.top_interacted_users.map(user => (
                <div className="mt-2">
                  <SourceOverview 
                    source={user.source}
                    button={<>{user.total_interaction}</>}
                    singleLine={true} />
                </div>
              ))
            ) : ("There are no sources.")}
          </DashboardPanel.Body>
        </DashboardPanel>
      </div>
    </div>
  );
}