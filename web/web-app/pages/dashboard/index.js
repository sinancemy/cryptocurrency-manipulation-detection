
import { useRequireLogin, useUser } from "../../user-hook"
import { useCallback, useEffect, useMemo, useState } from "react"
import { DashboardPanel } from "../../components/DashboardPanel"
import { SourceCard } from "../../components/SourceCard"
import Link from "next/link"
import { CuteButton } from "../../components/CuteButton"
import { dateToString } from "../../helpers"
import { CoinCard } from "../../components/CoinCard"
import { IoMdSettings } from "react-icons/io"
import { Prediction } from "../../components/Prediction"
import { PostList } from "../../components/PostList"
import { SortSelector } from "../../components/SortSelector"
import { ResponsiveGraph } from "../../components/ResponsiveGraph"

export default function DashboardPage() {  
  useRequireLogin()
  const { user } = useUser()

  const [sortByOption, setSortByOption] = useState("time")
  const [sortOrderOption, setSortOrderOption] = useState("descending")
  const [showPostsOption, setShowPostsOption] = useState("relevant")
  const [showPostsFromOption, setShowPostsFromOption] = useState("selected")

  const [graphSettings, setGraphSettings] = useState(null)
  const [showPostVolume, setShowPostVolume] = useState(true)
  const [graphSelection, setGraphSelection] = useState(null)
  const [selectedSources, setSelectedSources] = useState([])

  const selectedPostRange = useMemo(() => {
    if(!graphSelection || !graphSettings) return [0, 0]
    const pw0 = graphSelection.selectedRange[0].valueOf()
    const pw1 = graphSelection.selectedRange[1].valueOf()
    return [parseInt(pw0/1000), parseInt(pw1/1000)]
  }, [graphSelection, graphSettings])

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

  const selectedPricePoint = useMemo(() => {
    if(!graphSelection) return 0
    return graphSelection.mid
  }, [graphSelection])

  const selectedPostPoint = useMemo(() => {
    if(!graphSelection) return 0
    return graphSelection.midVolume
  }, [graphSelection])

  // Set the initial graph settings.
  useEffect(() => {
    if(!user || graphSettings) return
    setGraphSettings( {
      coinType: user.followed_coins.length > 0 ? user.followed_coins[0].coin_type : null,
      extent: "year",
      timeWindow: 30,
    })
  }, [user])

  const renderDependencies = [user, sortByOption, sortOrderOption, showPostVolume, showPostsFromOption, showPostsOption, showPostVolume, graphSelection, selectedPostRange,  
                                impactMap, selectedSources]

  return useMemo(() => (graphSettings &&
    <div className="animate-fade-in-down md:flex md:flex-col lg:grid lg:grid-cols-6">
      <div className="px-1 col-span-1">
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
      <div className="px-1 col-span-4">
        <div className="h-48 mb-2 overflow-hidden rounded-md bg-gray-900">
            <ResponsiveGraph
              coinType={graphSettings.coinType}
              showPostVolume={showPostVolume}
              timeWindowSetting={true}
              autoUpdateSetting={true}
              onSelected={(p) => { setGraphSelection(p); return true}} />
          </div>
        <div>
          <DashboardPanel collapsable={false} restrictedHeight={false}>
            <DashboardPanel.Header>
              <div className="flex items-center flex-justify-between font-normal">
                { selectedPostRange  && (
                <div>
                  <span>Showing new posts from{" "}</span>
                  <span className="font-semibold">{ dateToString(new Date(selectedPostRange[0]*1000), false) }</span>
                  <span>{" "}to{" "}</span>
                  <span className="font-semibold">{ dateToString(new Date(selectedPostRange[1]*1000), false) }</span>
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
      <div className="px-1 col-span-1">
        <DashboardPanel restrictedHeight={false}>
          <DashboardPanel.Header>
            Options
          </DashboardPanel.Header>
          <DashboardPanel.Body>
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
                {graphSelection ? (
                <>
                <div>
                  { dateToString(new Date(graphSelection.midDate)) }
                </div>
                <div>
                  <span className="font-semibold">{ graphSettings?.coinType?.toUpperCase() }/USD:{" "}</span>
                  <span>{ selectedPricePoint?.price.toPrecision(5) } </span>
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
                      setGraphSelection(null)
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
  ), renderDependencies);
}