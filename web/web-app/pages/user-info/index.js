import { DashboardPanel } from "../../components/DashboardPanel";
import axios from "axios";
import cookie from "cookie";
import { SimpleDropdown } from "../../components/SimpleDropdown";
import { PostOverview } from "../../components/PostOverview";
import { useEffect, useMemo, useState } from "react";
import { TiAt } from "react-icons/ti"
import Link from "next/link";
import { FollowButton } from "../../components/FollowButton";
import { useRequireLogin, useUser } from "../../user-hook";
import { getSourceParts } from "../../helpers";
import { useApiData } from "../../api-hook";
import { useRouter } from "next/router";
import { SortSelector } from "../../components/SortSelector";
import { PostList } from "../../components/PostList";

export default function UserInfo() {
  useRequireLogin()
  const router = useRouter()
  const sourceName = router.query.user
  // Redirect if the given sourceName does not denote a user.
  useEffect(() => {
    if(sourceName && sourceName.startsWith('*')) {
      router.push("/source-info?source=" + sourceName)
    }
  }, [sourceName])
  const { user, isFollowingSource } = useUser()
  // Fetch the user stats from the source stats endpoint.
  const userInfo  = useApiData(null, "source_stats", { 
    source: sourceName
  }, [user, sourceName], () => sourceName != null)  
  const [sortByOption, setSortByOption] = useState("interaction");
  const [sortOrderOption, setSortOrderOption] = useState("descending");

  return (!sourceName ? "..." :
    <div className="animate-fade-in-down grid grid-cols-12 mt-2 gap-2">
      <div className="col-start-2 col-span-2">
        <DashboardPanel collapsable={false}>
          <DashboardPanel.Header>
            <div className="grid grid-cols-1 place-items-center">
              <span className="text-4xl">
                <TiAt />
              </span>
              <span className="mt-2">
                { getSourceParts(sourceName)[0] }
              </span>
              <span className="mt-2 text-xs font-normal hover:underline">
                <Link href={`/source-info?source=*@${getSourceParts(sourceName)[1]}`}>
                  { getSourceParts(sourceName)[1] }
                </Link>
              </span>
              <span className="mt-2 font-light">
                {userInfo?.num_followers && userInfo.num_followers} Followers
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
      </div>
      <div className="col-start-4 col-span-7">
        <DashboardPanel restrictedHeight={false} collapsable={false}>
            <DashboardPanel.Header>
              <div className="flex items-center flex-justify-between font-normal">
                <div>
                  <span>Showing posts from{" "}</span>
                  <span className="font-semibold">{ sourceName }</span>
                </div>
                <span class="flex-grow"></span>
                <SortSelector
                  minimal={true}
                  sortByState={[sortByOption, setSortByOption]}
                  sortOrderState={[sortOrderOption, setSortOrderOption]}
                  sortByOptions={["time", "interaction", "impact"]} />
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
    </div>
  );
}