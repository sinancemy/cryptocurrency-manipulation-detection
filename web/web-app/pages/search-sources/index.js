import axios from "axios";
import cookie from "cookie";
import Router from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Field, Formik, Form } from "formik";
import { DashboardPanel } from "../../components/DashboardPanel";
import { SourceOverview } from "../../components/SourceOverview";
import { CuteButton } from "../../components/CuteButton";
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

  const cookies = cookie.parse(context.req.headers.cookie);
  const res2 = await axios.get("http://127.0.0.1:5000/user/info", {
    params: {
      token: cookies.token,
    },
  });
  var userinfo = null;
  if (res2.data.result === "ok") {
    userinfo = res2.data.userinfo;
  }

  const sourceListRes = await axios.get("http://127.0.0.1:5000/api/source_list")
  const userListRes = await axios.get("http://127.0.0.1:5000/api/user_list")
  let sourceListSet = new Set()

  for(const e of [...sourceListRes.data, ...userListRes.data]) {
    sourceListSet.add(e.user + '@' + e.source)
  }

  return {
    props: {
      allSources: [...sourceListSet],
      userInfo: userinfo,
    },
  };
}

export default function SearchSources({ allSources, userInfo, token }) {
  const router = useRouter();
  if (userInfo === null) {
    useEffect(() => {
      router.push("/");
    });
  }

  const [query, setQuery] = useState("");  
  const [sources, setSources] = useState(allSources)
  const [filteredSources, setFilteredSources] = useState([])
  const [followedSources, setFollowedSources] = useState(new Set(userInfo.followed_sources.map(source => source.source)))

  useEffect(() => {
    if (!query || query.trim() === "") {
      const rearranged = [...sources.filter(s => isFollowing(s))].concat(sources.filter(s => !followedSources.has(s)).slice(0, 10))
      setFilteredSources(rearranged)
      return
    }
    const filtered = sources.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    setFilteredSources(filtered.slice(0, 20))
  }, [sources, query, followedSources])


  const isFollowing = useCallback((source) => {
    return followedSources.has(source)
  }, [followedSources])

  return (
    <div className="grid grid-cols-3 mt-3 animate-fade-in-down">
      <div className="col-start-2">
        <DashboardPanel collapsable={false}>
          <DashboardPanel.Header>
            <h1 className="font-bold text-center text-2xl mt-4 mb-4">
              Search Sources
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
            <div>
              {filteredSources.map(source => (
                <SourceOverview
                  source={source}
                  button={(
                    <FollowButton
                      queryUrl={"http://127.0.0.1:5000/user/follow_source"}
                      queryParams={{token: token, source: source}}
                      isFollowing={() => isFollowing(source)}
                      onFollow={() => setFollowedSources(new Set([...followedSources, source]))}
                      onUnfollow={() => setFollowedSources(new Set([...followedSources].filter(s => s !== source)))}/>
                  )}/>
              ))}
            </div>
          </DashboardPanel.Body>
        </DashboardPanel>
      </div>
    </div>
  );
}
