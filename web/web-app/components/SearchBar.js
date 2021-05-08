import { useCallback, useEffect, useState } from "react"
import { AiOutlineLoading } from "react-icons/ai"
import { Arrow, useLayer } from "react-laag"
import { debounce } from "throttle-debounce"
import { useApiData } from "../api-hook"
import { SimpleCycler } from "./SimpleCycler"
import { SimpleDropdown } from "./SimpleDropdown"

export const SearchBar = () => {

  const [searchType, setSearchType] = useState("group")
  const [query, setQuery] = useState("")

  const { result: searchResults, isLoading: isLoadingResults } = useApiData([], "search", {
    type: searchType,
    query: query
  }, [], (params) => params[1] !== "")

  const [resultsShown, setResultsShown] = useState(false)
  const [focused, setFocused] = useState(false)

  const updateQuery = debounce(500, (input) => {
    setQuery(input)
  })

  const updateSearchType = useCallback(() => {
    setSearchType(searchType === "coin" ? "group" : searchType === "group" ? "user" : "coin")
  }, [searchType])

  const {
    triggerProps,
    layerProps,
    renderLayer
  } = useLayer({
    isOpen: focused,
    onOutsideClick: () => setFocused(false),
    placement: "bottom-start",
    triggerOffset: 8,
  })

  return (
    <div className={`${focused ? 'w-72' : 'w-72'} text-sm`}>
      <div {...triggerProps}
        className={`flex flex-row space-x-2 focus:outline-none h-8 overflow-hidden
                    border ${focused ? 'border-gray-400' : 'border-gray-800'} rounded`}
        onFocus={() => { setFocused(true) }}>
        <input type="text"
          className="shadow p-2 focus:outline-none flex-grow bg-transparent text-gray-200"
          onChange={(e) => updateQuery(e.target.value)}
          placeholder="Type to search..." />
        { focused && (
        <button className={`p-2 truncate text-xs flex-none text-gray-200 z-50 focus:outline-none`}
          onClick={updateSearchType}>
          in {searchType}s
        </button>
        )}
      </div>
      { focused && renderLayer(
        <div {...layerProps} className="w-72 text-gray-200">
          <div className={`flex flex-col bg-blue-50 max-h-64 overflow-scroll 
                          border border-gray-400 shadow-lg space-y-1 rounded-md
                          ${query == "" && "hidden"}`}>
            {searchResults.map(res => (
              <div className={`px-2 py-2 hover:bg-gray-900 text-sm ${isLoadingResults && 'opacity-50'}`}>
                { res }
              </div>
              ))}
              { searchResults.length === 0 && (
              <div className="px-2 py-2 text-gray-500 text-sm">
                No results
              </div>
              )}
              { isLoadingResults && (
              <div className="absolute top-1 left-2">
                <AiOutlineLoading className="animate-spin" />
              </div>
              )}
            </div>
        </div>
      ) }
    </div>
  )
}