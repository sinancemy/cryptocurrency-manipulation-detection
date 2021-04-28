import { DashboardPanel } from "../../components/DashboardPanel";
import axios from "axios";
import { useRouter } from "next/router";
import { Card } from "../../components/Card";
import cookie from "cookie";
import { SimpleDropdown } from "../../components/SimpleDropdown";
import { PostOverview } from "../../components/PostOverview";
import {
  getCoinColor,
  getCoinIcon,
  getSourceColor,
  getSourceIcon,
} from "../../Helpers";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { IoChatbubblesSharp } from "react-icons/io5";
import {
  FaRedditAlien,
  FaTwitter,
  FaEthereum,
  FaBitcoin,
} from "react-icons/fa";
import { CuteButton } from "../../components/CuteButton";

const textColor = "gray-200";
const mutedColor = "gray-500";
const color = "gray-900";
const borderColor = "gray-800";

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
      "&userlimit=20&coinlimit=20"
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
  post,
  isFollowingSource,
  token,
}) {
  const [buttonBoolean, setButtonBoolean] = useState(isFollowingSource);
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

  const followSource = async () => {
    if (buttonBoolean) {
      setButtonBoolean(!buttonBoolean);
      await axios.get(
        "http://127.0.0.1:5000/user/follow_source?token=" +
          token +
          "&source=" +
          sourceName +
          "&unfollow=1"
      );
    } else {
      await axios.get(
        "http://127.0.0.1:5000/user/follow_source?token=" +
          token +
          "&source=" +
          sourceName +
          "&unfollow=0"
      );
      setButtonBoolean(buttonBoolean);
    }
  };

  return (
    <div className="animate-fade-in-down grid grid-cols-12 mt-2 gap-4">
      <div className="col-start-2 col-span-2">
        <DashboardPanel collapsable={false}>
          <DashboardPanel.Header>
            <div className="grid grid-cols-1 place-items-center">
              {sourceName.includes("twitter") ? (
                <FaTwitter className="h-12 w-12 items-center" />
              ) : (
                <FaRedditAlien className="h-12 w-12 items-center" />
              )}
              <span className="mt-2">{sourceName.slice(2)}</span>
              <CuteButton onClick={() => followSource()} disabled={() => false}>
                {buttonBoolean ? "Unfollow" : "Follow"}
              </CuteButton>
            </div>
          </DashboardPanel.Header>
          <DashboardPanel.Body></DashboardPanel.Body>
        </DashboardPanel>
        <DashboardPanel collapsable={false}>
          <DashboardPanel.Header>
            <p>Top Active Users</p>
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            <ul>
              {topActiveUsers.map((user, index) => (
                <li className="flex flex-row mb-2" key={index}>
                  <div
                    className={`w-1.5 bg-${getSourceColor(
                      user.user + "@" + sourceName.slice(2)
                    )} rounded-l`}
                  ></div>
                  <div
                    className={`grid grid-cols-6 gap-1 py-2 px-4 w-full text-${textColor} bg-${color} border border-${borderColor} rounded-r`}
                  >
                    <div className={`flex flex-col`}>
                      <span className="font-semibold width-50">
                        {user.user}
                      </span>
                      <div
                        className={`py-1 flex flex-row items-center text-xs text-${mutedColor}`}
                      >
                        <span className="mr-1">
                          {getSourceIcon(user.user + "@" + sourceName.slice(2))}
                        </span>
                        <span>{sourceName.slice(2)}</span>
                      </div>
                      <div
                        className={`flex flex-row items-center text-xs text-${mutedColor}`}
                      ></div>
                    </div>
                    <div className={"col-span-4"}>
                      <p></p>
                    </div>
                    <div className={`flex flex-col`}>
                      <div
                        className={`px-2 py-1 flex flex-row items-center justify-end text-${mutedColor}`}
                      >
                        <IoChatbubblesSharp />
                        <span className="ml-1">{user.msg_count}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </DashboardPanel.Body>
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
        <DashboardPanel>
          <DashboardPanel.Header>
            <p className="text-center">Relevant Coins</p>
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            {relevantCoins.length > 0
              ? relevantCoins.map((coin) => (
                  <Link href={`/coin-info?coin=` + coin.coin_type}>
                    <div className="mt-2">
                      <Card
                        badgeColor={getCoinColor(coin.coin_type)}
                        icon={getCoinIcon(coin.coin_type)}
                        isSelected={() => true}
                      >
                        <Card.Title>
                          <span className="hover:underline">
                            {coin.coin_type.toUpperCase()}
                          </span>
                        </Card.Title>
                        <Card.Input></Card.Input>
                      </Card>
                    </div>
                  </Link>
                ))
              : "No Relevant Coins Found."}
          </DashboardPanel.Body>
          <DashboardPanel.Footer></DashboardPanel.Footer>
        </DashboardPanel>
        <DashboardPanel collapsable={false}>
          <DashboardPanel.Header>
            <p>Top Interacted Users</p>
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            <ul>
              {topInteractedUsers.map((user, index) => (
                <li className="flex flex-row mb-2" key={index}>
                  <div
                    className={`w-1.5 bg-${getSourceColor(
                      user.user + "@" + sourceName.slice(2)
                    )} rounded-l`}
                  ></div>
                  <div
                    className={`grid grid-cols-6 gap-1 py-2 px-4 w-full text-${textColor} bg-${color} border border-${borderColor} rounded-r`}
                  >
                    <div className={`flex flex-col`}>
                      <span className="font-semibold width-50">
                        {user.user}
                      </span>
                      <div
                        className={`py-1 flex flex-row items-center text-xs text-${mutedColor}`}
                      >
                        <span className="mr-1">
                          {getSourceIcon(user.user + "@" + sourceName.slice(2))}
                        </span>
                        <span>{sourceName.slice(2)}</span>
                      </div>
                      <div
                        className={`flex flex-row items-center text-xs text-${mutedColor}`}
                      ></div>
                    </div>
                    <div className={"col-span-4"}>
                      <p></p>
                    </div>
                    <div className={`flex flex-col`}>
                      <div
                        className={`px-2 py-1 flex flex-row items-center justify-end text-${mutedColor}`}
                      >
                        <IoChatbubblesSharp />
                        <span className="ml-1">{user.msg_count}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </DashboardPanel.Body>
        </DashboardPanel>
      </div>
    </div>
  );
}
