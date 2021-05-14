
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
import { ResponsiveGraph } from "../../components/Graph/ResponsiveGraph"

export default function DashboardPage() {  
  useRequireLogin()
  const { followedCoins, followedSources } = useUser()

  const [sortByOption, setSortByOption] = useState("time")
  const [sortOrderOption, setSortOrderOption] = useState("descending")
  const [showPostsOption, setShowPostsOption] = useState("relevant")
  const [showPostsFromOption, setShowPostsFromOption] = useState("selected")

  const [coinType, setCoinType] = useState(null)
  const [showPostVolume, setShowPostVolume] = useState(true)
  const [selectedSources, setSelectedSources] = useState([])
  const [selectedPostRange, setSelectedPostRange] = useState([0, 0])
  const [impactMap, setImpactMap] = useState(new Map())

  const calculateImpactMap = useCallback((posts) => {
    if(posts == null || posts.size === 0) setImpactMap(new Map())
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


  const handleGraphSelect = useCallback((minDate, maxDate) => {
    setSelectedPostRange([parseInt(minDate.valueOf()/1000),
      parseInt(maxDate.valueOf()/1000)])
  }, [])

  // Set the initial coin type.
  useEffect(() => {
    setCoinType(followedCoins.length > 0 ? followedCoins[0].target : null)
  }, [followedCoins])

  const renderDependencies = [followedSources, followedCoins, sortByOption, sortOrderOption, showPostVolume,
                              showPostsFromOption, showPostsOption, showPostVolume, selectedPostRange, impactMap,
                              selectedSources, coinType]

  return useMemo(() => (
    <div>
      <div className="animate-fade-in-down mx-5 mt-3 md:flex md:flex-col
                      lg:flex lg:flex-row lg:justify-center">
        <div className="px-1 flex-none">
        <DashboardPanel width={72}>
            <DashboardPanel.Header>
                Followed Coins
            </DashboardPanel.Header>
            <DashboardPanel.Body>
              {coinType && followedCoins && followedCoins.length > 0 ?
                followedCoins.map(follow => (
                  <div className="mt-2"> 
                    <CoinCard 
                      onToggle={() => setCoinType(follow.target)}
                      isSelected={() => coinType === follow.target}
                      coin={follow.target} />
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
          <DashboardPanel width={72}>
            <DashboardPanel.Header>
                  Followed Sources
            </DashboardPanel.Header>
            <DashboardPanel.Body>
              {followedSources && followedSources.length > 0 ? (
                followedSources.map(follow => (
                  <div className="mt-2">
                    <SourceCard 
                      onToggle={() => {if(selectedSources.includes(follow.target)) {
                                        setSelectedSources(selectedSources.filter(x => x !== follow.target))
                                      } else {
                                        setSelectedSources([...selectedSources, follow.target])
                                      }}}
                      isSelected={() => selectedSources.includes(follow.target)}
                      source={follow.target} />
                  </div>
                ))
              ) : ("Not following any sources.")}
            </DashboardPanel.Body>
            <DashboardPanel.Footer>
              <div className="flex flex-row space-x-2">
                <CuteButton
                  onClick={() => setSelectedSources([...followedSources?.map(f => f.target)])}
                  isDisabled={() => selectedSources.length === followedSources.length}>
                  Select all
                </CuteButton>
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
        <div className="px-1 w-3/5 flex-none">
          <div className="h-48 mb-2 overflow-hidden rounded-md bg-gray-900">
            {coinType && (
              <ResponsiveGraph
                coinType={coinType}
                showPostVolume={showPostVolume}
                timeWindowSetting={true}
                autoUpdateSetting={true}
                onSelectedRange={handleGraphSelect} />
            )}
            {!coinType && (
              <div className={"text-white p-2"}>
                Please choose a coin to analyze.
              </div>
            )}
            </div>
          <div>
            <DashboardPanel collapsable={false} restrictedHeight={false} width={'full'}>
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
                  <span className="flex-grow"></span>
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
                  coinType={showPostsOption === "all" ? "all" : coinType}
                  selectedSources={selectedSources.length === 0 ? "all" : selectedSources}
                  sortBy={sortByOption}
                  sortOrder={sortOrderOption}
                  onUpdate={calculateImpactMap} />
              </DashboardPanel.Body>
            </DashboardPanel>
          </div>
        </div>
        <div className="px-1 flex-none">
        <DashboardPanel width={72}>
            <DashboardPanel.Header>
              Options
            </DashboardPanel.Header>
            <DashboardPanel.Body>
            <div className="py-2 border-t border-gray-780 py-3">
              <label className="flex items-center">
                <input 
                  type="checkbox"
                  checked={showPostVolume}
                  onChange={() => setShowPostVolume(!showPostVolume)}
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
          </DashboardPanel.Body>
          </DashboardPanel>
          <DashboardPanel width={72}>
            <DashboardPanel.Header>
              Predictions
            </DashboardPanel.Header>
            <DashboardPanel.Body>
              { [...impactMap.entries()].map(e => (
                <Prediction prediction={e[1]} coin={e[0]} />
              ))}
            </DashboardPanel.Body>
          </DashboardPanel>
        </div>
      </div>
    </div>
  ), renderDependencies);
}