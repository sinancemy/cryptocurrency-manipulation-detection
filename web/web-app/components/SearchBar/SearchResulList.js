import {useCallback, useState} from "react"
import Link from "next/link"
import {useKeyUp} from "./keypress-hook"
import {useRouter} from "next/router"

export const SearchResultList = ({ searchResults, searchType, isLoadingResults }) => {

  const router = useRouter()

  const urlFor = useCallback((searchResult) => {
    if(searchType === "coin") return "/coin-info?coin=" + searchResult
    if(searchType === "group") return "/source-info?source=" + searchResult
    if(searchType === "user") return "/user-info?user=" + searchResult
    return "#"
  }, [searchType])

  const [currIndex, setCurrIndex] = useState(-1)

  const select = useCallback(() => {
    router.push(urlFor(searchResults[currIndex]))
  }, [urlFor, searchResults, currIndex])

  const navigateList = useCallback((change) => {
    setCurrIndex(currIndex => (currIndex + change + searchResults.length) % searchResults.length)
  }, [searchResults, currIndex])

  //useKeyUp(40, () => navigateList(1))
  //useKeyUp(38, () => navigateList(-1))
  //useKeyUp(13, select)

  return ( searchResults && searchResults.length > 0 &&
    searchResults.map((searchResult, i) => (
      <div className={`px-2 py-2 ${i === currIndex && 'bg-gray-900'} text-sm ${isLoadingResults && 'opacity-50'}`}
        onMouseEnter={() => setCurrIndex(i)}>
        <Link href={urlFor(searchResult)}>
          { searchResult }
        </Link>
      </div>
    ))
  )
}