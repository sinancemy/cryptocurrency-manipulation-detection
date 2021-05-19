import { DashboardPanel } from "../../components/DashboardPanel";
import { SimpleDropdown } from "../../components/SimpleDropdown";
import { PostOverview } from "../../components/PostOverview";
import { getSourceIcon, getSourceParts } from "../../helpers";
import { useEffect, useMemo, useState } from "react";
import { SourceOverview } from "../../components/SourceOverview";
import { CoinOverview } from "../../components/CoinOverview";
import { FollowButton } from "../../components/FollowButton";
import { useApiData } from "../../api-hook";
import { useRequireLogin, useUser } from "../../user-hook";
import { useRouter } from "next/router";
import { PostList } from "../../components/PostList";
import { SortSelector } from "../../components/SortSelector";

export default function SourceInfo() {
  useRequireLogin()
  const router = useRouter()
  const sourceName = router.query.source
  // Redirect if the given sourceName does not represent a full source.
  useEffect(() => {
    if(sourceName && !sourceName.startsWith('*')) {
      router.push("/user-info?user=" + sourceName)
    }
  }, [sourceName])
  const { followedSources } = useUser()
  // Fetch the source info and update it when the user changes.
  const { result: sourceInfo } = useApiData(null, "source_stats", { 
    source: sourceName
  }, [followedSources, sourceName], () => sourceName != null)
  const [sortByOption, setSortByOption] = useState("interaction")
  const [sortOrderOption, setSortOrderOption] = useState("descending")

  return (!sourceName ? "..." :
    <div className="animate-fade-in-down grid grid-cols-12 mt-2 gap-2">
      <div className="col-start-2 col-span-2">
        <DashboardPanel collapsable={false}>
          <DashboardPanel.Header>
            <div className="grid grid-cols-1 mt-2 place-items-center">
              <span className="text-4xl">{ getSourceIcon(sourceName) }</span>
              <span className="mt-2">{ getSourceParts(sourceName)[1] }</span>
              <span className="mt-2 font-light">
                {sourceInfo?.num_followers && sourceInfo.num_followers} Followers
              </span>
              <div className="mt-2">
                <FollowButton
                  followType={"source"}
                  followTarget={sourceName} />
              </div>
            </div>
          </DashboardPanel.Header>
          <DashboardPanel.Body></DashboardPanel.Body>
        </DashboardPanel>
        <DashboardPanel collapsable={false}>
          <DashboardPanel.Header>
            <p className="text-center">Relevant Coins</p>
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            {sourceInfo?.relevant_coins && sourceInfo.relevant_coins.length > 0
              ? sourceInfo.relevant_coins.map(coin => (
                  <CoinOverview 
                    coin={coin.coin_type}
                    singleLine={true} />
                ))
              : "No Relevant Coins Found."}
          </DashboardPanel.Body>
          <DashboardPanel.Footer></DashboardPanel.Footer>
        </DashboardPanel>
      </div>
      <div className="col-start-4 col-span-6">
        <DashboardPanel restrictedHeight={false} collapsable={false}>
          <DashboardPanel.Header>
            <div className="flex items-center flex-justify-between font-normal">
              <div>
                <span>Showing posts from{" "}</span>
                <span className="font-semibold">{ getSourceParts(sourceName)[1] }</span>
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
              coinType={"all"}
              selectedRange={"all"}
              selectedSources={[sourceName]}
              sortBy={sortByOption}
              sortOrder={sortOrderOption} />
          </DashboardPanel.Body>
        </DashboardPanel>
      </div>
      <div className="col-start-10 col-span-2">
        <DashboardPanel collapsable={false}>
          <DashboardPanel.Header>
            <p>Top Interacted Users</p>
          </DashboardPanel.Header>
          <DashboardPanel.Body>
              {sourceInfo?.top_interacted_users && sourceInfo.top_interacted_users.map(user => (
                <div className="mb-2">
                  <SourceOverview
                    source={user.source}
                    button={<>{user.total_interaction}</>} 
                    singleLine={true} />
                </div>
              ))}
          </DashboardPanel.Body>
        </DashboardPanel>
        <DashboardPanel collapsable={false}>
          <DashboardPanel.Header>
            <p>Top Active Users</p>
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            {sourceInfo?.top_active_users && sourceInfo.top_active_users.map(user => (
              <div className="mb-2">
                <SourceOverview
                  source={user.source}
                  button={<>{user.total_msg}</>}
                  singleLine={true} />
              </div>
              ))}
          </DashboardPanel.Body>
        </DashboardPanel>
      </div>
    </div>
  );
}