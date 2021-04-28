import axios from "axios";
import cookie from "cookie";
import { DashboardPanel } from "../../components/DashboardPanel"
import { SimpleDropdown } from "../../components/SimpleDropdown"
import { useCallback, useEffect, useRef, useState } from "react";
import { PostOverview } from "../../components/PostOverview"
import { CuteButton } from "../../components/CuteButton"
import { SourceCard } from "../../components/SourceCard"

export async function getServerSideProps(context) {
    if (context.req.headers.cookie == null) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }
    const res = await axios.get("http://127.0.0.1:5000/api/source_list");
    
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
    var reddit_source = res.data
    .filter((source) => source.source.includes("reddit"))
    .sort((a, b) => a.source.localeCompare(b.source));

  let users = [];

  await Promise.all(
    reddit_source.map(async (source) => {
      let reddit_users = new Set();
      const res3 = await axios.get(
        "http://127.0.0.1:5000/api/posts?source=" + source.source
      );
      res3.data.forEach((entry) => {
        reddit_users.add(entry.user);
      });
      reddit_users = Array.from(reddit_users).sort();
      reddit_users.unshift("Follow All Sources");
      users.push([source.source, reddit_users]);
    })
  );

  let twitter_users = [];
  res.data
    .filter((source) => source.source.includes("twitter"))
    .forEach((source) => twitter_users.push(source.username));

  twitter_users.sort();
  twitter_users.unshift("Follow All Sources");
  users = users.sort((a, b) => a[0].localeCompare(b[0]));
  users.unshift(["twitter", twitter_users]);


  let source = context.query.user.substring(context.query.user.indexOf("@")+1)
  let user = context.query.user.substring(0, context.query.user.indexOf("@"))
  const res4 = await axios.get("http://127.0.0.1:5000/api/posts?source=" + source + "&user=" + user);

  let post = res4.data

  return {
    props: {
      users: users,
      userInfo: userinfo,
      userQuery: context.query.user,
      post: post,
    },
  };
  }

export default function CoinInfo({userQuery, userInfo, post}){

    const [sortByOption, setSortByOption] = useState("interaction")
    const [sortOrderOption, setSortOrderOption] = useState("descending")
    const [posts, setPosts] = useState([])
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

    return(
        <div className="animate-fade-in-down mx-10 grid grid-cols-6">
         <div className="col-start-3 py-5 col-span-2">
            <div className="col-start-2 bg-white border-b rounded">
                <h1 className="font-bold text-center text-2xl py-2">
                    {userQuery.substring(0, userQuery.indexOf("@"))} - {userQuery.substring(userQuery.indexOf("@")+1)}
                </h1>
            </div>
        </div>

        <div className="col-start-2 py-2 col-span-4">
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
          {post.length > 0 ? (
            <div className="overflow-y-auto max-h-128">
              {post.map((post, i) => (
                <PostOverview post={post} />
              ))}
            </div>
            ) : (
              <div className="mt-2">There aren't any posts from this user.</div>
            )}
          </DashboardPanel.Body>
        </DashboardPanel>
        </div>

    </div>
    );
}