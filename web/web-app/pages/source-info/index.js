import { DashboardPanel } from "../../components/DashboardPanel";
import axios from "axios";
import { Card } from "../../components/Card";
import cookie from "cookie";
import { SimpleDropdown } from "../../components/SimpleDropdown";
import { PostOverview } from "../../components/PostOverview";
import {
  getCoinColor,
  getCoinIcon,
  getSourceColor,
  getSourceIcon,
  getSourceParts,
} from "../../Helpers";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CuteButton } from "../../components/CuteButton";
import { SourceOverview } from "../../components/SourceOverview"
import { CoinOverview } from "../../components/CoinOverview"
import { FollowButton } from "../../components/FollowButton";

export async function getServerSideProps(context) {
  if (context.req.headers.cookie == null) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const res = await axios.get(
    "http://127.0.0.1:5000/api/source_info?source=" +
      context.query.source.slice(2) +
      "&userlimit=4&coinlimit=20"
  );

  const res2 = await axios.get(
    "http://127.0.0.1:5000/api/posts?source=" + context.query.source.slice(2)
  );

  const cookies = cookie.parse(context.req.headers.cookie);
  const res3 = await axios.get("http://127.0.0.1:5000/user/info", {
    params: {
      token: cookies.token,
    },
  });
  var userinfo = null;
  if (res3.data.result === "ok") {
    userinfo = res3.data.userinfo;
  }

  let isFollowing = false;
  userinfo.followed_sources.forEach((source) => {
    if (source.source.includes(context.query.source)) {
      isFollowing = true;
    }
  });

  return {
    props: {
      sourceName: context.query.source,
      relevantCoins: res.data.relevant_coins,
      topActiveUsers: res.data.top_active_users,
      topInteractedUsers: res.data.top_interacted_users,
      numFollowers: res.data.num_followers,
      post: res2.data,
      isFollowingSource: isFollowing,
    },
  };
}

export default function SourceInfo({
  sourceName,
  relevantCoins,
  topActiveUsers,
  topInteractedUsers,
  numFollowers,
  post,
  isFollowingSource,
  token}) {
  const [followerCount, setFollowerCount] = useState(numFollowers);
  const [isFollowing, setIsFollowing] = useState(isFollowingSource);
  const [sortByOption, setSortByOption] = useState("interaction");
  const [sortOrderOption, setSortOrderOption] = useState("descending");
  const [posts, setPosts] = useState(post);
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

    const onFollow = () => {
      setFollowerCount(followerCount + 1)
      setIsFollowing(true);
    }

    const onUnfollow = () => {
      setFollowerCount(followerCount -1)
      setIsFollowing(false);
    }

  return (
    <div className="animate-fade-in-down grid grid-cols-12 mt-2 gap-2">
      <div className="col-start-2 col-span-2">
        <DashboardPanel collapsable={false}>
          <DashboardPanel.Header>
            <div className="grid grid-cols-1 mt-2 place-items-center">
              <span className="text-4xl">{ getSourceIcon(sourceName) }</span>
              <span className="mt-2">{sourceName.slice(2)}</span>
              <span className="mt-2 font-light">
                {followerCount} Followers
              </span>
              <div className="mt-2">
                <FollowButton
                  queryUrl={"http://127.0.0.1:5000/user/follow_source"}
                  queryParams={{token: token, source: sourceName}}
                  isFollowing={() => isFollowing}
                  onFollow={onFollow}
                  onUnfollow={onUnfollow}
                  />
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
            {relevantCoins.length > 0
              ? relevantCoins.map(coin => (
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
        <DashboardPanel collapsable={false} restrictedHeight={false}>
          <DashboardPanel.Header>
            <div className="flex items-center flex-justify-between font-normal">
              <div>
                <span>Showing all posts from </span>
                <span className="font-semibold">{sourceName.slice(2)}</span>
              </div>
              <span class="flex-grow"></span>
              <div className="flex text-xs items-center">
                <div className="flex items-center border-gray-780 mr-2 px-2">
                  <span className="">sort by</span>
                  <SimpleDropdown
                    options={["time", "interaction", "user"]}
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
      <div className="col-start-10 col-span-2">
        <DashboardPanel collapsable={false}>
          <DashboardPanel.Header>
            <p>Top Interacted Users</p>
          </DashboardPanel.Header>
          <DashboardPanel.Body>
              {topInteractedUsers.map(user => (
                <SourceOverview
                  source={user.user + "@" + getSourceParts(sourceName)[1]}
                  button={<>{user.total_interaction}</>} 
                  singleLine={true} />
              ))}
          </DashboardPanel.Body>
        </DashboardPanel>
        <DashboardPanel collapsable={false}>
          <DashboardPanel.Header>
            <p>Top Active Users</p>
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            {topActiveUsers.map(user => (
                <SourceOverview
                  source={user.user + "@" + getSourceParts(sourceName)[1]}
                  button={<>{user.total_msg}</>}
                  singleLine={true} />
              ))}
          </DashboardPanel.Body>
        </DashboardPanel>
      </div>
    </div>
  );
}
