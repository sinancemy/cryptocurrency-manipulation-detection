import { useRouter } from "next/router"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Graph } from "../../components/Graph"
import axios from "axios"
import { DashboardPanel } from "../../components/DashboardPanel"
import cookie from "cookie"
import { SimpleDropdown } from "../../components/SimpleDropdown"
import { useCookies } from "react-cookie"
import { VerticalSelector } from "../../components/VerticalSelector"
import { SourceCard } from "../../components/SourceCard"
import Link from "next/link"
import { CuteButton } from "../../components/CuteButton"
import { PostOverview } from "../../components/PostOverview"
import { dateToString, getCoinColor, getCoinIcon, getSourceColor, getSourceIcon } from "../../Helpers"
import { CoinCard } from "../../components/CoinCard"
import { IoMdSettings } from "react-icons/io"
import { withParentSize } from '@vx/responsive';
import { Prediction } from "../../components/Prediction"


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
  const initialGraphSettings = {
    coinType: userinfo.followed_coins.length > 0 ? userinfo.followed_coins[0].coin_type : null,
    extent: "year",
    timeWindow: 30,
  }
  return {
    props: {
      userInfo: userinfo,
      initialGraphSettings: initialGraphSettings,
    }
  }
}

export default function Dashboard({userInfo, initialGraphSettings}) {  
  const [prices, setPrices] = useState([])
  const [posts, setPosts] = useState([])
  const [postVolume, setPostVolume] = useState([])
  const [impactMap, setImpactMap] = useState(new Map())
  
  const [graphSettings, setGraphSettings] = useState(initialGraphSettings)
  const [showPostVolume, setShowPostVolume] = useState(true)
  const [selectedRange, setSelectedRange] = useState(null)
  const [sortedPosts, setSortedPosts] = useState([])
  const [selectedSources, setSelectedSources] = useState([])

  const [sortByOption, setSortByOption] = useState("time")
  const [sortOrderOption, setSortOrderOption] = useState("descending")
  const [showPostsOption, setShowPostsOption] = useState("relevant")
  const [showPostsFromOption, setShowPostsFromOption] = useState("selected")

  const discardDuplicatePosts = (posts) => {
    const dict = {}
    posts.forEach(p => {
      dict[p.unique_id] = p
    });
    return Object.values(dict)
  }

  const isGraphLoaded = useCallback(() => {
    return prices.length > 0 && postVolume.length > 0
  }, [prices, postVolume])

  const getSelectedPrice = useCallback(() => {
    const date = parseInt(selectedRange.midDate.valueOf()/1000)
    return prices.find(p => p.time === date)?.price
  }, [prices, selectedRange])

  const getSelectedVolume = useCallback(() => {
    const date = parseInt(selectedRange.midDate.valueOf()/1000)
    return postVolume.find(p => date >= p.time && date < p.next_time)?.volume
  }, [postVolume, selectedRange])

  const getSelectedRange = useCallback(() => {
    if(selectedRange == null) return [0, 0]
    const pw0 = selectedRange.midDate.valueOf() - (graphSettings.timeWindow/2) * 1000 * 60 * 60 * 24
    const pw1 = selectedRange.midDate.valueOf() + (graphSettings.timeWindow/2) * 1000 * 60 * 60 * 24
    return [pw0, pw1]
  }, [selectedRange, graphSettings])

  const updatePosts = useCallback((start, end) => {
    const type = (showPostsOption === "all") ? "*" : graphSettings.coinType 
    const sourcesToConsider = (showPostsFromOption === "all") ? ["*@*"] : selectedSources
    const requests = sourcesToConsider.map(src_string => {
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
      console.log(collectedUniques)
      setPosts(collectedUniques)
      }))
    }, [[showPostsFromOption, showPostsOption, graphSettings, selectedSources]]);

    useEffect(() => {
      if(posts == null || posts.size == 0) return
      console.log(posts)
      let newImpactMap = new Map()
      for (const p of posts) {
        newImpactMap.set(p.coin_type, [])
      }
      for(const p of posts) {
        newImpactMap.get(p.coin_type).push(p.impact)
      }
      const average = arr => arr.reduce(( p, c ) => p + c, 0 ) / arr.length

      for(const p of newImpactMap.keys()) {
        console.log(newImpactMap)
        const first = average(newImpactMap.get(p).map(e => e[0]))
        const second = average(newImpactMap.get(p).map(e => e[1]))
        const third = average(newImpactMap.get(p).map(e => e[2]))
        const fourth = average(newImpactMap.get(p).map(e => e[3]))
        newImpactMap.set(p, [first, second, third, fourth])
      }
      setImpactMap(newImpactMap)
    }, [posts])

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
    const [pw0, pw1] = getSelectedRange()
    updatePosts(parseInt(pw0/1000), parseInt(pw1/1000))
  }, [showPostsOption, showPostsFromOption, selectedRange, graphSettings, selectedSources])

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
        ticks: 1000
      }
    }).then(res => {
      setPostVolume(res.data)
    }) 
  }, [graphSettings])

  const ResponsiveGraph = withParentSize(Graph)

  return (
    <div className="animate-fade-in-down mx-10 md:flex md:flex-col lg:grid lg:grid-cols-6 mt-2">
      <div className="p-1 col-span-1">
        <DashboardPanel>
          <DashboardPanel.Header>
              Followed Coins
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            {userInfo && userInfo.followed_coins.length > 0 ? 
            userInfo?.followed_coins.map(coin => (
              <div className="mt-2"> 
                <CoinCard 
                  onToggle={() => setGraphSettings({...graphSettings, coinType: coin.coin_type})}
                  isSelected={() => graphSettings.coinType && graphSettings.coinType === coin.coin_type}
                  coin={coin.coin_type} />
              </div>
              )) : ("Not following any coins.")}
          </DashboardPanel.Body>
          <DashboardPanel.Footer>
            <div className="flex flex-row">
                <span className="flex-grow"></span>
                <Link href="/search-coins">
                <CuteButton>
                  <IoMdSettings />
                </CuteButton>
              </Link>
             </div>
          </DashboardPanel.Footer>
        </DashboardPanel>
        <DashboardPanel>
          <DashboardPanel.Header>
                Followed Sources
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            {userInfo && userInfo.followed_sources.length > 0 ? (
              userInfo.followed_sources.map(source => (
                <div className="mt-2">
                  <SourceCard 
                    onToggle={() => {if(selectedSources.includes(source.source)) {
                                      setSelectedSources(selectedSources.filter(x => x !== source.source))
                                    } else {
                                      setSelectedSources([...selectedSources, source.source])
                                    }}}
                    isSelected={() => selectedSources.includes(source.source)}
                    source={source.source} />
                </div>
              ))
            ) : ("Not following any sources.")}
          </DashboardPanel.Body>
          <DashboardPanel.Footer>
            <div className="flex flex-row">
              <CuteButton
                onClick={() => setSelectedSources([...userInfo.followed_sources.map(s => s.source)])}
                isDisabled={() => selectedSources.length === userInfo.followed_sources.length}>
                Select all
              </CuteButton>
              <span className="flex-grow"></span>
              <CuteButton
                onClick={() => setSelectedSources([])}
                isDisabled={() => selectedSources.length === 0}>
                Unselect all
              </CuteButton>
              <span className="flex-grow"></span>
              <Link href="/search-sources">
                <CuteButton>
                  <IoMdSettings />
                </CuteButton>
              </Link>
             </div>  
          </DashboardPanel.Footer>
        </DashboardPanel>
      </div>
      <div className="p-1 col-span-4">
        <div className="h-48 mb-2 overflow-hidden rounded-md bg-gray-900">
        { isGraphLoaded() && userInfo && userInfo.followed_coins.length > 0 && prices.length > 0 ? (
            <ResponsiveGraph 
              stock={prices}
              postVolume={postVolume}
              showPostVolume={showPostVolume}
              graphSettings={graphSettings} 
              selectedRange={selectedRange} 
              setSelectedRange={setSelectedRange} />
        ) : (
          <div className="p-5 text-gray-800">
            No price data found.
          </div>
        ) }
          </div>
        <div>
        <DashboardPanel collapsable={false} restrictedHeight={false}>
          <DashboardPanel.Header>
            <div className="flex items-center flex-justify-between font-normal">
              { selectedRange && graphSettings.coinType && (
              <div>
                <span>Showing new posts from{" "}</span>
                <span className="font-semibold">{ dateToString(new Date(getSelectedRange()[0]), false) }</span>
                <span>{" "}to{" "}</span>
                <span className="font-semibold">{ dateToString(new Date(getSelectedRange()[1]), false) }</span>
              </div>
              )}
              <span class="flex-grow"></span>
              <div className="flex text-xs items-center">
                <div className="flex items-center border-r border-gray-780 mr-2 px-2">
                  <span className="">sort by</span>
                    <SimpleDropdown 
                      options={['time', 'interaction', 'user']} 
                      selected={sortByOption} 
                      setSelected={setSortByOption} />
                    <span className="mx-1">in</span>
                    <SimpleDropdown 
                      options={['ascending', 'descending']} 
                      selected={sortOrderOption} 
                      setSelected={setSortOrderOption} />
                    <span className="mx-1">order</span>
                </div>
                <div className="flex items-center px-2">
                  <span className="mx-1">show</span>
                    <SimpleDropdown 
                      options={['relevant', 'all']} 
                      selected={showPostsOption} 
                      setSelected={setShowPostsOption} />
                  <span className="mx-1">posts from</span>
                    <SimpleDropdown
                      options={['all', 'selected']}
                      selected={showPostsFromOption}
                      setSelected={setShowPostsFromOption} />
                    <span className="mx-1">sources</span>
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
            ) : (selectedRange) ? (
              <div className="mt-2">No new posts to show in the selected range.</div>
            ) : (
              <div className="mt-2">Please select a range from the graph and select your sources from the left panel to see the posts.</div>
            )}
          </DashboardPanel.Body>
        </DashboardPanel>
        </div>
      </div>
      <div className="p-1 col-span-1">
        <DashboardPanel restrictedHeight={false}>
          <DashboardPanel.Header>
            Graph View
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            <div className="py-2">
              <div className="font-bold">
                Range
              </div>
              <div>
                <VerticalSelector
                  options={['day', 'week', 'month', 'year']}
                  getter={() => graphSettings.extent}
                  setter={(opt) => setGraphSettings({...graphSettings, extent: opt})}
                  prefix={"Last"}
                />
              </div>
            </div>
          <div className="py-2">
            <div className="font-bold">
              Time window
            </div>
            <div>
              <VerticalSelector
                options={[5, 10, 30, 60]}
                getter={() => graphSettings.timeWindow}
                setter={(opt) => setGraphSettings({...graphSettings, timeWindow: opt})}
                suffix={"days"}
              />
              </div>
          </div>
          <div className="py-2 border-t border-gray-780 py-3">
            <label className="flex items-center">
              <input 
                type="checkbox"
                checked={showPostVolume}
                onClick={() => setShowPostVolume(!showPostVolume)}
              />
              <p className="ml-2">Show post volume</p>
            </label>
            <label className="flex items-center mt-2">
              <input 
                type="checkbox"
              />
              <p className="ml-2">Denote predictions</p>
            </label>
          </div>
          <div className="pt-2 border-t border-gray-780">
            <div className="font-bold">
              Selection
            </div>
            <div className="text-md">
              <div className="px-4 py-4 mt-2 bg-gray-800 rounded-md">
                {selectedRange ? (
                <>
                <div>
                  { dateToString(new Date(selectedRange.midDate)) }
                </div>
                <div>
                  <span className="font-semibold">{ graphSettings.coinType.toUpperCase() }/USD:{" "}</span>
                  <span>{ getSelectedPrice()?.toPrecision(5) } </span>
                </div>
                <div>
                  <span className="font-semibold">Posts (cumulative):{" "}</span>
                  <span className="col-span-4">{ getSelectedVolume() }</span>
                </div>
                <div className="w-full pt-2">
                  <CuteButton
                    onClick={() => {
                      setSelectedRange(null)
                      setPosts(null)
                    }}
                    size={'md'}
                  >
                    Clear selection
                  </CuteButton>
                </div>
                </> ) : ("No selection") }
              </div>
            </div>
          </div>
          </DashboardPanel.Body>
        </DashboardPanel>
        <DashboardPanel>
          <DashboardPanel.Header>
            Predictions
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            <div className="mt-2">
              { [...impactMap.entries()].map(e => (
                <div className="flex flex-col">
                  <span className="mr-1">{e[0].toUpperCase()}</span>
                  <span>
                    <Prediction prediction={e[1]} />
                  </span>
                </div>
              ))}
            </div>
          </DashboardPanel.Body>
        </DashboardPanel>
      </div>
    </div>
  );
}
