import axios from "axios";
import cookie from "cookie";
import { useEffect, useState } from "react";
import { DashboardPanel } from "../../components/DashboardPanel";
import { SourceOverview } from "../../components/SourceOverview";
import { FollowButton } from "../../components/FollowButton";
import { useApiData } from "../../api-helpers";
import { useRequireLogin, useUser } from "../../user-helpers";


export default function SearchSources() {
  useRequireLogin()
  const { user, isFollowingSource } = useUser()
  const [query, setQuery] = useState("");  
  const sources = useApiData([], "source_list", {}, [], [], (res) => res.map(s => s.user + '@' + s.source))
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
  }, [sources, query, user])

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
                      followEndpoint={"follow_source"}
                      params={{source: source}}
                      isFollowing={() => isFollowingSource(source)} />
                  )}/>
              ))}
            </div>
          </DashboardPanel.Body>
        </DashboardPanel>
      </div>
    </div>
  );
}
