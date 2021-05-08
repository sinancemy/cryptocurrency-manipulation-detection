import axios from "axios";
import cookie from "cookie";
import { useCallback, useEffect, useState } from "react";
import { DashboardPanel } from "../../components/DashboardPanel";
import { SourceOverview } from "../../components/SourceOverview";
import { FollowButton } from "../../components/FollowButton";
import { useApiData } from "../../api-hook";
import { useRequireLogin, useUser } from "../../user-hook";


export default function SearchSources() {
  useRequireLogin()
  const { isFollowing } = useUser()

  const isFollowingSource = useCallback((source) => isFollowing("source", source), [isFollowing])
  const [query, setQuery] = useState("");  
  const { result: sources } = useApiData([], "source_list", {}, [])
  const [filteredSources, setFilteredSources] = useState([])

  useEffect(() => {
    if (!query || query.trim() === "") {
      const rearranged = [...sources.filter(s => isFollowingSource(s))].concat(sources.filter(s => !isFollowingSource(s)).slice(0, 10))
      setFilteredSources(rearranged)
      return
    }
    const filtered = sources.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    const sorted = [...filtered].sort((a, b) => a.localeCompare(b))
    setFilteredSources(sorted.slice(0, 20))
  }, [sources, query, isFollowingSource])

  return (
    <div className="grid grid-cols-3 mt-3 animate-fade-in-down">
      <div className="col-start-2">
        <DashboardPanel collapsable={false} width={"full"}>
          <DashboardPanel.Header>
            <h1 className="font-bold text-center text-2xl mt-4 mb-4">
              Sources
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
            {filteredSources.map(source => (
            <div className="mb-2">
              <SourceOverview
                source={source}
                button={(
                  <FollowButton
                    followType={"source"}
                    followTarget={source} />
                )}/>
              </div>
              ))}
          </DashboardPanel.Body>
        </DashboardPanel>
      </div>
    </div>
  );
}
