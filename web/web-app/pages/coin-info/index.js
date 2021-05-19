import { DashboardPanel } from "../../components/DashboardPanel"
import { useEffect, useState } from "react";
import { CuteButton } from "../../components/CuteButton"
import { SourceCard } from "../../components/SourceCard"
import { SourceOverview } from "../../components/SourceOverview";
import { getCoinIcon } from "../../helpers";
import { FollowButton } from "../../components/FollowButton";
import { useRequireLogin, useUser } from "../../user-hook";
import { useApiData } from "../../api-hook";
import { useRouter } from "next/router";
import { PostList } from "../../components/PostList";
import { SortSelector } from "../../components/SortSelector";
import { ResponsiveGraph } from "../../components/Graph/ResponsiveGraph";

export default function CoinInfo() {
  useRequireLogin()
  const router = useRouter()
  const coinName = router.query.coin
  const { user, isFollowingCoin } = useUser()
  const { result: coinStats } = useApiData(null, "coin_stats", { type: coinName }, [coinName, user], () => coinName != null)
  const [selectedSources, setSelectedSources] = useState([])
  const [sortByOption, setSortByOption] = useState("interaction")
  const [sortOrderOption, setSortOrderOption] = useState("descending")

  useEffect(() => {
    if(!coinStats) return
    setSelectedSources(coinStats.top_sources.map(s => s.source))
  }, [coinStats])


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
                  followType={"coin"}
                  followTarget={coinName} />
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
          {coinStats?.last_price && coinStats && 
            <ResponsiveGraph
              coinType={coinName}
              timeWindow={0}
              showPostVolume={true}
              autoUpdateSetting={true} />
          }
        </div>
        <DashboardPanel restrictedHeight={false} collapsable={false}>
          <DashboardPanel.Header>
            <div className="flex items-center flex-justify-between font-normal">
              <div>
                <span>Showing posts about{" "}</span>
                <span className="font-semibold">{ coinName.toUpperCase() }</span>
              </div>
              <span class="flex-grow"></span>
              <SortSelector
                minimal={true}
                sortByState={[sortByOption, setSortByOption]}
                sortOrderState={[sortOrderOption, setSortOrderOption]} />
            </div>
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            <PostList
              selectedRange={"all"}
              coinType={coinName}
              selectedSources={selectedSources}
              sortBy={sortByOption}
              sortOrder={sortOrderOption}
              disabled={selectedSources.length === 0} />
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