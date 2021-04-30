import { DashboardPanel } from "../../components/DashboardPanel";
import axios from "axios";
import cookie from "cookie";
import { SimpleDropdown } from "../../components/SimpleDropdown";
import { PostOverview } from "../../components/PostOverview";
import { useEffect, useMemo, useState } from "react";
import { TiAt } from "react-icons/ti"
import Link from "next/link";
import { FollowButton } from "../../components/FollowButton";
import { useRequireLogin, useUser } from "../../user-helpers";
import { getSourceParts } from "../../Helpers";
import { useApiData } from "../../api-helpers";
import { useRouter } from "next/router";

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
  // Fetch the source info.
  const userInfo  = useApiData(null, "source_info", { 
    source: getSourceParts(sourceName)[1],
    user: getSourceParts(sourceName)[0]
  }, [user, sourceName], [sourceName])  
  const [sortByOption, setSortByOption] = useState("interaction");
  const [sortOrderOption, setSortOrderOption] = useState("descending");
  const posts = useApiData([], "posts", {
    source: getSourceParts(sourceName)[1],
    user: getSourceParts(sourceName)[0]
  }, [sourceName], [sourceName]);
  const [sortedPosts, setSortedPosts] = useState([]);

  useEffect(() => {
    if (posts === null || posts.length === 0) {
      setSortedPosts([]);
      return;
    }
    const sorter =
      sortByOption === "time"
        ? (a, b) => a.time - b.time
        : sortByOption === "interaction"
        ? (a, b) => a.interaction - b.interaction
        : (a, b) => ("" + a.user).localeCompare(b.user);
    const sorted = [...posts].sort(sorter);
    if (sortOrderOption === "descending") {
      sorted.reverse();
    }
    setSortedPosts(sorted);
  }, [posts, sortOrderOption, sortByOption]);

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
                  followEndpoint={"follow_source"}
                  params={{source: sourceName}}
                  isFollowing={() => isFollowingSource(sourceName)}
                  />
              </div>
            </div>
          </DashboardPanel.Header>
          <DashboardPanel.Body></DashboardPanel.Body>
        </DashboardPanel>
      </div>
      <div className="col-start-4 col-span-7">
        <DashboardPanel collapsable={false} restrictedHeight={false}>
          <DashboardPanel.Header>
            <div className="flex items-center flex-justify-between font-normal">
              <div>
                <span>Showing all posts from </span>
                <span className="font-semibold">{sourceName}</span>
              </div>
              <span class="flex-grow"></span>
              <div className="flex text-xs items-center">
                <div className="flex items-center border-gray-780 mr-2 px-2">
                  <span className="">sort by</span>
                  <SimpleDropdown
                    options={["time", "interaction"]}
                    selected={sortByOption}
                    setSelected={setSortByOption}
                  />
                  <span className="mx-1">in</span>
                  <SimpleDropdown
                    options={["ascending", "descending"]}
                    selected={sortOrderOption}
                    setSelected={setSortOrderOption}
                  />
                  <span className="mx-1">order</span>
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
              <div className="mt-2">No posts to show.</div>
            )}
          </DashboardPanel.Body>
        </DashboardPanel>
      </div>
    </div>
  );
}