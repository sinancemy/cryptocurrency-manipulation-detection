import { useCallback, useEffect, useMemo, useState } from "react"
import { Graph } from "../../components/Graph"
import axios from "axios"
import { DashboardPanel } from "../../components/DashboardPanel"
import cookie from "cookie"
import { SimpleDropdown } from "../../components/SimpleDropdown"
import { VerticalSelector } from "../../components/VerticalSelector"
import { SourceCard } from "../../components/SourceCard"
import Link from "next/link"
import { CuteButton } from "../../components/CuteButton"
import { PostOverview } from "../../components/PostOverview"
import { dateToString, getAvgImpact } from "../../helpers"
import { CoinCard } from "../../components/CoinCard"
import { IoMdSettings } from "react-icons/io"
import { withParentSize } from '@vx/responsive';
import { Prediction } from "../../components/Prediction"
import { useRequireLogin, useUser } from "../../user-hook"
import { useApiData } from "../../api-hook"
import { PostList } from "../../components/PostList"
import { SortSelector } from "../../components/SortSelector"

export default function Dashboard() {  
  useRequireLogin()
  const { user } = useUser()
  
  const [sortByOption, setSortByOption] = useState("time")
  const [sortOrderOption, setSortOrderOption] = useState("descending")
  const [showPostsOption, setShowPostsOption] = useState("relevant")
  const [showPostsFromOption, setShowPostsFromOption] = useState("selected")

  const [graphSettings, setGraphSettings] = useState(null)
  const [showPostVolume, setShowPostVolume] = useState(true)
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [selectedSources, setSelectedSources] = useState([])

  const selectedPostRange = useMemo(() => {
    if(!selectedPoint || !graphSettings) return [0, 0]
    const pw0 = selectedPoint.midDate.valueOf() - (graphSettings.timeWindow/2) * 1000 * 60 * 60 * 24
    const pw1 = selectedPoint.midDate.valueOf() + (graphSettings.timeWindow/2) * 1000 * 60 * 60 * 24
    return [parseInt(pw0/1000), parseInt(pw1/1000)]
  }, [selectedPoint, graphSettings])

  const [impactMap, setImpactMap] = useState(new Map())

  const calculateImpactMap = useCallback((posts) => {
    if(posts == null || posts.size == 0) setImpactMap(new Map())
    let newImpactMap = new Map()
    for (const p of posts) {
      newImpactMap.set(p.coin_type, [])
    }
    for(const p of posts) {
      newImpactMap.get(p.coin_type).push(p.impact)
    }
    const average = arr => arr.reduce(( p, c ) => p + c, 0 ) / arr.length
    for(const p of newImpactMap.keys()) {
      const first = average(newImpactMap.get(p).map(e => e[0]))
      const second = average(newImpactMap.get(p).map(e => e[1]))
      const third = average(newImpactMap.get(p).map(e => e[2]))
      const fourth = average(newImpactMap.get(p).map(e => e[3]))
      newImpactMap.set(p, [first, second, third, fourth])
    }
    setImpactMap(newImpactMap)
  })

  const selectedPriceRange = useMemo(() => {
    if(!graphSettings) return [0, 0]
    const decrement = 60 * 60 * 24 * ((graphSettings.extent === "day") ? 1 : 
                                      (graphSettings.extent === "month") ? 30 :
                                      (graphSettings.extent === "week") ? 7 : 365)
    const winHigh = 1583625601
    const winLow = winHigh - decrement
    return [winLow, winHigh]
  }, [graphSettings])

  // Indicating when to refetch the prices.
  const shouldRefetchPrices = useCallback(() => graphSettings && selectedPriceRange[0] !== selectedPriceRange[1])
  // Fetching the prices.
  const prices = useApiData([], "prices", {
    start: selectedPriceRange[0],
    end: selectedPriceRange[1],
    type: graphSettings?.coinType
  }, [selectedPriceRange, graphSettings], shouldRefetchPrices,
      (prices) => prices?.reverse())
  // Fetching the post volume.
  const postVolume = useApiData([], "post_volume", {
    start: selectedPriceRange[0],
    end: selectedPriceRange[1],
    type: graphSettings?.coinType,
    ticks: 1000
  }, [selectedPriceRange, graphSettings], shouldRefetchPrices)

  const selectedPrice = useMemo(() => {
    if(!selectedPoint) return 0
    const date = parseInt(selectedPoint.midDate.valueOf()/1000)
    return prices.find(p => p.time === date)?.price
  }, [prices, selectedPoint])

  const selectedPostPoint = useMemo(() => {
    if(!selectedPoint) return 0
    const date = parseInt(selectedPoint.midDate.valueOf()/1000)
    return postVolume.find(p => date >= p.time && date < p.next_time)
  }, [postVolume, selectedPoint])

  // Set the initial graph settings.
  useEffect(() => {
    if(!user) return
    setGraphSettings( {
      coinType: user.followed_coins.length > 0 ? user.followed_coins[0].coin_type : null,
      extent: "year",
      timeWindow: 30,
    })
  }, [user])

  const ResponsiveGraph = withParentSize(Graph)

  return (graphSettings &&
    <div className="animate-fade-in-down mx-10 md:flex md:flex-col lg:grid lg:grid-cols-6 mt-2">
      <div className="p-1 col-span-1">
        <DashboardPanel>
          <DashboardPanel.Header>
              Followed Coins
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            {user?.followed_coins && user.followed_coins.length > 0 ? 
              user.followed_coins.map(coin => (
                <div className="mt-2"> 
                  <CoinCard 
                    onToggle={() => setGraphSettings({...graphSettings, coinType: coin.coin_type})}
                    isSelected={() => graphSettings?.coinType && graphSettings?.coinType === coin.coin_type}
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
            {user?.followed_sources && user.followed_sources.length > 0 ? (
              user.followed_sources.map(source => (
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
                onClick={() => setSelectedSources([...user?.followed_sources.map(s => s.source)])}
                isDisabled={() => selectedSources.length === user?.followed_sources.length}>
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
          { prices && postVolume && prices.length > 0 && postVolume.length > 0 && graphSettings ? (
          <ResponsiveGraph 
            stock={prices}
            postVolume={postVolume}
            showPostVolume={showPostVolume}
            graphSettings={graphSettings} 
            selectedRange={selectedPoint} 
            setSelectedRange={setSelectedPoint} />
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
                { selectedPostRange  && (
                <div>
                  <span>Showing new posts from{" "}</span>
                  <span className="font-semibold">{ dateToString(new Date(selectedPostRange[0]), false) }</span>
                  <span>{" "}to{" "}</span>
                  <span className="font-semibold">{ dateToString(new Date(selectedPostRange[1]), false) }</span>
                </div>
                )}
                <span class="flex-grow"></span>
                <SortSelector
                  sortByState={[sortByOption, setSortByOption]}
                  sortOrderState={[sortOrderOption, setSortOrderOption]}
                  showPostsState={[showPostsOption, setShowPostsOption]}
                  showPostsFromState={[showPostsFromOption, setShowPostsFromOption]} />
              </div>
            </DashboardPanel.Header>
            <DashboardPanel.Body>
              <PostList
                selectedRange={selectedPostRange}
                coinType={graphSettings.coinType}
                selectedSources={selectedSources}
                sortBy={sortByOption}
                sortOrder={sortOrderOption}
                allSources={showPostsFromOption === "all"}
                showIrrelevant={showPostsOption === "all"}
                onUpdate={calculateImpactMap} />
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
                  getter={() => graphSettings?.extent}
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
                getter={() => graphSettings?.timeWindow}
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
              <p className="ml-2">Show heartbeat</p>
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
                {selectedPoint ? (
                <>
                <div>
                  { dateToString(new Date(selectedPoint.midDate)) }
                </div>
                <div>
                  <span className="font-semibold">{ graphSettings?.coinType?.toUpperCase() }/USD:{" "}</span>
                  <span>{ selectedPrice?.toPrecision(5) } </span>
                </div>
                <div>
                  <span className="font-semibold">Posts (cumulative):{" "}</span>
                  <span className="col-span-4">{ selectedPostPoint?.volume }</span>
                </div>
                <div>
                  <span className="font-semibold">Posts (new):{" "}</span>
                  <span className="col-span-4">{ selectedPostPoint?.count }</span>
                </div>
                <div className="w-full pt-2">
                  <CuteButton
                    onClick={() => {
                      setSelectedPoint(null)
                    }}
                    size={'md'}>
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
                <Prediction prediction={e[1]} coin={e[0]} />
              ))}
            </div>
          </DashboardPanel.Body>
        </DashboardPanel>
      </div>
    </div>
  );
}