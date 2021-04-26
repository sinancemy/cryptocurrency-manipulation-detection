import { useRouter } from "next/router"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import Graph from "../../components/Graph"
import { withParentSize } from "@vx/responsive"
import axios from "axios"
import { DashboardPanel } from "../../components/DashboardPanel"
import cookie from "cookie"
import { SimpleDropdown } from "../../components/SimpleDropdown"
import { useCookies } from "react-cookie"


export async function getServerSideProps(context) {
  const cookies = cookie.parse(context.req.headers.cookie)
  const userinfoResp = await axios.get("http://127.0.0.1:5000/user/info", {
    params: {
      token: cookies.token
    }
  })

  if(userinfoResp.data.result !== "ok") {
    return {
      redirect: {
        destination: '/login'
      }
    }
  }
  const userinfo = userinfoResp.data.userinfo
  const coinsResp = await axios.get("http://127.0.0.1:5000/api/coin_list")
  const initialGraphSettings = {
    coinType: userinfo.followed_coins.length > 0 ? userinfo.followed_coins[0].coin_type : null,
    extent: "year",
    timeWindow: 30,
  }
  return {
    props: {
      userInfo: userinfo,
      coins: coinsResp.data,
      initialGraphSettings: initialGraphSettings,
    }
  }
}

export default function Dashboard({coins, userInfo, loggedIn, initialGraphSettings}) {  
  const ResponsiveGraph = withParentSize(Graph)
  const [prices, setPrices] = useState([])
  const [posts, setPosts] = useState([])
  const [postVolume, setPostVolume] = useState([])
  
  const [graphSettings, setGraphSettings] = useState(initialGraphSettings)
  const [showPostVolume, setShowPostVolume] = useState(true)
  const [selectedRange, setSelectedRange] = useState(null)
  const [sortedPosts, setSortedPosts] = useState([])
  const [selectedSources, setSelectedSources] = useState(['*@reddit/Bitcoin'])

  const [sortByOption, setSortByOption] = useState("time")
  const [sortOrderOption, setSortOrderOption] = useState("ascending")
  const [showPostsOption, setShowPostsOption] = useState("relevant")

  const discardDuplicatePosts = (posts) => {
    const dict = {}
    posts.forEach(p => {
      dict[p.unique_id] = p
    });
    return Object.values(dict)
  }

  const updatePosts = useCallback((start, end) => {
    console.log("updating...")
    const type = (showPostsOption === "relevant") ? graphSettings.coinType : "*"
    const requests = selectedSources.map(src_string => {
      const [username, source] = src_string.split('@')
      return axios.get("http://127.0.0.1:5000/api/posts", {
        params: {
          start: start,
          end: end,
          type: type,
          user: username,
          source: source
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
    }, [showPostsOption, graphSettings, selectedSources]);

    // Sorter (this effect will be updating the shown posts!)
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

  // Listen to changes in the relevant settings and refetch the posts.
  useEffect(() => {
    if(selectedRange == null) return
    const pw0 = selectedRange.midDate.valueOf() - (graphSettings.timeWindow/2) * 1000 * 60 * 60 * 24
    const pw1 = selectedRange.midDate.valueOf() + (graphSettings.timeWindow/2) * 1000 * 60 * 60 * 24
    updatePosts(parseInt(pw0/1000), parseInt(pw1/1000))
  }, [showPostsOption, selectedRange, graphSettings, selectedSources])

  // Listen to changes in the relevant settings and refetch the prices shown on the graph.
  useEffect(() => {
    if(graphSettings.coinType == null) return
    const decrement = 60 * 60 * 24 * ((graphSettings.extent === "day") ? 1 : 
                                      (graphSettings.extent === "month") ? 30 :
                                      (graphSettings.extent === "week") ? 7 : 365)
    const winHigh = 1583625601
    const winLow = winHigh - decrement
    // Fetch the prices.
    axios.get("http://127.0.0.1:5000/api/prices", {
      params: {
        start: winLow,
        end: winHigh,
        type: graphSettings.coinType
      }
    }).then(res => {
      const prices = res.data?.reverse()
      setPrices(prices)
    })
    // Fetch the post volume.
    axios.get("http://127.0.0.1:5000/api/post_volume", {
      params: {
        start: winLow,
        end: winHigh,
        type: graphSettings.coinType,
        ticks: 100
      }
    }).then(res => {
      setPostVolume(res.data)
    }) 
  }, [graphSettings])

  return (
    <div className="animate-fade-in-down mx-10 py-4 grid grid-cols-6 gap-4 text-yellow-50">
      <div>
        <DashboardPanel>
          <DashboardPanel.Header>
              Followed Coins
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            {userInfo && userInfo.followed_coins.length > 0 ? (
            <ul className="mt-2 ">
              {userInfo?.followed_coins.map((coin, i) => (
                <li className="mt-2" key={i}>
                  <label className="flex items-center hover:font-semibold">
                    <input 
                      type="radio" 
                      name="coin-type"
                      onClick={() => setGraphSettings({...graphSettings, coinType: coin.coin_type})}
                      checked={graphSettings.coinType && graphSettings.coinType === coin.coin_type}
                    />
                    <p className="ml-2">{coin.coin_type}</p>
                    </label>
                </li>
              ))}
            </ul>
            ) : ("Not following any coins.")}
          </DashboardPanel.Body>
        </DashboardPanel>
        <DashboardPanel>
          <DashboardPanel.Header>
                Followed Sources
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            {userInfo && userInfo.followed_sources.length > 0 ? (
            <ul>
              {userInfo.followed_sources.map((source, i) => (
                <li className="mt-2" key={i}>
                  <label className="flex items-center">
                    <input 
                      type="checkbox"
                      checked={selectedSources.includes(source.source)}
                      onClick={() => {
                        if(selectedSources.includes(source.source)) {
                          setSelectedSources(selectedSources.filter(x => x !== source.source))
                        } else {
                          setSelectedSources([...selectedSources, source.source])
                        }
                      }}
                    />
                    <p className="ml-2">{source.source}</p>
                  </label>
                </li>
              ))}
            </ul>
            ) : ("Not following any sources.")}
          </DashboardPanel.Body>
        </DashboardPanel>
      </div>
      <div className="col-span-4">
        { userInfo && userInfo.followed_coins.length > 0 && prices.length > 0 ? (
            <>
            <div className="h-1/5 mb-5 rounded-lg drop-shadow-2xl overflow-hidden lg:col-span-3 bg-blue-128">
            <ResponsiveGraph 
              stock={prices}
              postVolume={postVolume}
              showPostVolume={showPostVolume}
              graphSettings={graphSettings} 
              selectedRange={selectedRange} 
              setSelectedRange={setSelectedRange}
            />
            </div>
              </>
          ) : (
            <div className="ml-5 mt-5 text-black">
              No price data found.
            </div>
          ) }
        <div className="max-h-128">
        <DashboardPanel collapsable={false}>
          <DashboardPanel.Header>
            <div className="flex flex-justify-between font-light">
              { selectedRange && graphSettings.coinType && (
              <div>
                <span className="font-semibold">{ selectedRange.mid.price.toPrecision(5) }</span>
                <span className="ml-1">{ graphSettings.coinType.toUpperCase() }/USD</span> at{" "}
                <span className="font-semibold">{ new Date(selectedRange.midDate).toLocaleString() }</span>
              </div>
              )}
              <span class="flex-grow"></span>
              <div className="flex">
                <div className="border-r mr-2 pr-2">
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
                <div>
                  show {" "}
                    <SimpleDropdown 
                      options={['relevant', 'all']} 
                      selected={showPostsOption} 
                      setSelected={setShowPostsOption} />
                    {" "} posts
                </div>
              </div>
            </div>
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            {sortedPosts.length > 0 ? (
            <ul className="overflow-y-auto mt-2">
              {sortedPosts.map((post, i) => (
                <li
                  key={i}
                  className="grid grid-cols-5 gap-3 text-black border py-1 px-4 bg-white justify-between rounded-md mt-2"
                >
                  <div>
                    <span className="font-semibold underline width-50">{post.user}</span><br /> 
                    {post.source}
                  </div>
                  <div className="col-span-3">
                    <p>{post.content}</p>
                  </div>
                  <div>
                    <p className="text-sm">{new Date(post.time*1000).toLocaleString('en-US', {hour12: false})}
                    <br />
                    Interaction: {post.interaction}</p>
                  </div>
                </li>
              ))}
            </ul>
            ) : (selectedRange) ? (
              <div>No posts to show in the selected range from the selected sources.</div>
            ) : (
              <div>Please select a range from the graph and select your sources from the left panel to see the posts.</div>
            )}
          </DashboardPanel.Body>
        </DashboardPanel>
        </div>
      </div>
      <div>
        <DashboardPanel>
          <DashboardPanel.Header>
            Graph View
          </DashboardPanel.Header>
          <DashboardPanel.Body>
          <ul className="mt-2">
            <li>
              <button 
                className={graphSettings.extent === "day" && ("font-bold underline")}
                onClick={e => setGraphSettings({ ...graphSettings, extent: "day" })}
              >
                Last day
              </button>
            </li>
            <li>
              <button 
                className={graphSettings.extent === "week" && ("font-bold underline")}
                onClick={e => setGraphSettings({ ...graphSettings, extent: "week" })}
              >
                Last week
              </button>
            </li>
            <li>
              <button 
                className={graphSettings.extent === "month" && ("font-bold underline")}
                onClick={e => setGraphSettings({ ...graphSettings, extent: "month" })}
              >
                Last month
              </button>
            </li>
            <li>
              <button 
                className={graphSettings.extent === "year" && ("font-bold underline")}
                onClick={() => setGraphSettings({ ...graphSettings, extent: "year" })}
              >
                Last year
              </button>
            </li>
          </ul>
          <div class="mt-2 border-t border-b py-3">
            <div class="flex flex-row">
              <button
                className={graphSettings.timeWindow === 5 && ("font-bold underline")}
                onClick={() => setGraphSettings({ ...graphSettings, timeWindow: 5 })}
              >
                5
              </button>
              <button
                className={`ml-1 ${graphSettings.timeWindow === 10 && ("font-bold underline")}`}
                onClick={() => setGraphSettings({ ...graphSettings, timeWindow: 10 })}
              >
                10
              </button>
              <button
                className={`ml-1 ${graphSettings.timeWindow === 30 && ("font-bold underline")}`}
                onClick={() => setGraphSettings({ ...graphSettings, timeWindow: 30 })}
              >
                30
              </button>
              <button
                className={`ml-1 ${graphSettings.timeWindow === 60 && ("font-bold underline")}`}
                onClick={() => setGraphSettings({ ...graphSettings, timeWindow: 60 })}
              >
                60
              </button>
              <span className="ml-1">days.</span>
            </div>
          </div>
          <div className="mt-2">
            <label className="flex items-center">
              <input 
                type="checkbox"
                checked={showPostVolume}
                onClick={() => setShowPostVolume(!showPostVolume)}
              />
              <p className="ml-2">Show post volume</p>
            </label>
          </div>
          </DashboardPanel.Body>
        </DashboardPanel>
        <DashboardPanel>
          <DashboardPanel.Header>
            Predictions
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            <ul className="mt-2">
              {coins.map((coin, i) => (
                <li className="flex items-center mt-2" key={i}>
                  <img className="h-12 w-12" src={coin.image} alt="logo" />
                  <p className="ml-2">{coin.name}</p>
                </li>
              ))}
            </ul>
          </DashboardPanel.Body>
        </DashboardPanel>
      </div>
    </div>
  );
}
