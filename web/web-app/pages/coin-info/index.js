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
  
  const res3 = await axios.get("http://127.0.0.1:5000/api/coin_info?type=" + context.query.coin);

  let lastPrice = res3.data.last_price
  let topActiveUsers = res3.data.top_active_users
  let topInteractedUsers = res3.data.top_interacted_users
  let topSources = res3.data.top_sources

  return {
    props: {
      userInfo: userinfo,
      coinQuery: context.query.coin,
      topSources: topSources,
      lastPrice: lastPrice,
      topActiveUsers: topActiveUsers,
      topInteractedUsers: topInteractedUsers,
    },
  };
  }

export default function CoinInfo({coinQuery, userInfo, topSources, lastPrice, topActiveUsers, topInteractedUsers}){

    const [sortByOption, setSortByOption] = useState("interaction")
    const [sortOrderOption, setSortOrderOption] = useState("descending")
    const [posts, setPosts] = useState([])
    const [sortedPosts, setSortedPosts] = useState([])
    const [selectedSources, setSelectedSources] = useState([])

    const discardDuplicatePosts = (posts) => {
        const dict = {}
        posts.forEach(p => {
          dict[p.unique_id] = p
        });
        return Object.values(dict)
      }

      const updatePosts = useCallback(() => {
        console.log("updating...")
        const sourcesToConsider = selectedSources
        console.log(sourcesToConsider)
        const requests = sourcesToConsider.map(src_string => {
            const [user, source] = src_string.split('@')
          return axios.get("http://127.0.0.1:5000/api/posts?type=" + coinQuery, {
            params: {
              user: user,
              source: source,
            }
          })
        })
        // Get the posts.
        axios.all(requests).then(axios.spread((...resps) => {
          const collected = []
          resps.forEach(resp => {
            collected.push(...resp.data)
          });
          const collectedUniques = discardDuplicatePosts(collected)
          setPosts(collectedUniques)
          }))
        }, [[selectedSources]]);  

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
        updatePosts()
      }, [selectedSources])

    return(
        <div className="animate-fade-in-down mx-10 grid grid-cols-6">
          <div className="col-start-3 py-5 col-span-2">
              <div className="col-start-2 bg-white border-b rounded">
                  <h1 className="font-bold text-center text-2xl py-2">
                      {coinQuery.toUpperCase() + " - Current Price:  $" + lastPrice.price}
                  </h1>
              </div>
          </div>
        <div className="col-start-1 p-1 col-span-1">
        <DashboardPanel>
          <DashboardPanel.Header>
                Top Sources
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            { topSources.length > 0 ? (
                topSources.map(source => (
                <div className="mt-2">
                  <SourceCard 
                    source={"*@" + source.source}
                    isSelected={() => selectedSources.includes("*@" + source.source)}
                    onToggle={() => {
                      if(selectedSources.includes("*@" + source.source)) {
                        setSelectedSources(selectedSources.filter(x => x !== "*@" + source.source))
                      } else {
                        setSelectedSources([...selectedSources, "*@" + source.source])
                      }
                    }} />
                </div>
              ))
            ) : ("There are no sources.")}
          </DashboardPanel.Body>
          <DashboardPanel.Footer>
            <div className="flex flex-row">
              <CuteButton
                onClick={() => setSelectedSources(topSources.map(s => "*@"+s.source))}
                disabled={() => selectedSources.length === topSources.length}>
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
        </DashboardPanel>
        </div>

        <div className="col-start-2 py-1 col-span-4">
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

        <div className="col-start-6 p-1 col-span-1">
        <DashboardPanel>
          <DashboardPanel.Header>
                Top Active Users
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            { topActiveUsers.length > 0 ? (
                topActiveUsers.map(source => (
                <div className="mt-2">
                  <SourceCard 
                    source={source.user +"@"+ source.source}
                    isSelected={() => 1+1}
                    onToggle={() => 1+1} />
                </div>
              ))
            ) : ("There are no sources.")}
          </DashboardPanel.Body>
        </DashboardPanel>

        <DashboardPanel>
          <DashboardPanel.Header>
                Top Interacted Users
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            { topInteractedUsers.length > 0 ? (
                topInteractedUsers.map(source => (
                <div className="mt-2">
                  <SourceCard 
                    source={source.user +"@"+ source.source}
                    isSelected={() => 1+1}
                    onToggle={() => 1+1} />
                </div>
              ))
            ) : ("There are no sources.")}
          </DashboardPanel.Body>
        </DashboardPanel>
        </div>

    </div>
    );
}