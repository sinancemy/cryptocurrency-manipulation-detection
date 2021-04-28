import { DashboardPanel } from "../../components/DashboardPanel";
import axios from "axios";
import cookie from "cookie";
import { SimpleDropdown } from "../../components/SimpleDropdown";
import { PostOverview } from "../../components/PostOverview";
import { useEffect, useState } from "react";
import { FaRedditAlien, FaTwitter } from "react-icons/fa";
import { CuteButton } from "../../components/CuteButton";

export async function getServerSideProps(context) {
  if (context.req.headers.cookie == null) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const splitted = context.query.user.split("@");
  const res2 = await axios.get(
    "http://127.0.0.1:5000/api/posts?source=" +
      splitted[1] +
      "&user=" +
      splitted[0]
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
    if (source.source.includes(context.query.user)) {
      isFollowing = true;
    }
  });

  return {
    props: {
      sourceName: context.query.user,
      post: res2.data,
      isFollowingSource: isFollowing,
    },
  };
}

export default function UserInfo({
  sourceName,
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

  const followUser = async () => {
    if (buttonBoolean) {
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
    }
    setButtonBoolean(!buttonBoolean);
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
              <span className="mt-2">{sourceName}</span>
              <div className="mt-2">
                <CuteButton onClick={() => followUser()} disabled={() => false}>
                  {buttonBoolean ? "Unfollow" : "Follow"}
                </CuteButton>
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
