import { useCallback, useEffect, useMemo, useState } from "react"
import { fetchFromApi, useApiData } from "../api-hook"
import { CuteButton } from "./CuteButton"
import { PostOverview } from "./PostOverview"
import { AiOutlineLoading } from "react-icons/ai"

const API_POST_LIMIT = 50

export const PostList = ({ selectedRange = "all", coinType = "all", selectedSources = "all", sortBy, sortOrder, disabled = false, onUpdate = (posts) => {} }) => {
  
  const [shownPosts, setShownPosts] = useState([])
  const [canLoadMore, setCanLoadMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(true)

  // Indicating changes in which states will result in a refetch of the posts.
  const fetchPostsParams = useMemo(() => {
    return {
      source: selectedSources === "all" ? null : selectedSources.join(";"),
      type: coinType === "all" ? null : coinType,
      start: selectedRange === "all" ? null : selectedRange[0],
      end: selectedRange === "all" ? null : selectedRange[1],
      sort: sortBy,
      desc: sortOrder === "descending" ? 1 : 0
    }
  }, [selectedSources, coinType, selectedRange, sortBy, sortOrder])

  // Fetching the posts (initializer).
  const { result: posts, isLoading: isLoadingPosts } = useApiData([], "posts", fetchPostsParams, [], () => !disabled)
  // The first movement to the shown posts.
  useEffect(() => {
    if(!posts) return
    setCanLoadMore(posts.length === API_POST_LIMIT)
    setLoadingMore(false)
    setShownPosts(posts)
  }, [posts])
  // Invoke the callback.
  useEffect(() => {
    onUpdate(shownPosts)
  }, [shownPosts])
  useEffect(() => {
    if(disabled) setShownPosts([])
  }, [disabled])
  const lastScrolled = useMemo(() => {
    if(!shownPosts || shownPosts.length === 0) return 0
    const last = shownPosts[shownPosts.length-1]
    return (sortBy === "time") ? last.time
          : (sortBy === "interaction") ? last.interaction
          : (sortBy === "user") ? last.user
          : (sortBy === "impact") ? last.avg_impact
          : 0
  }, [shownPosts, sortBy])

  const loadMore = useCallback(() => {
    if(!canLoadMore) return
    setLoadingMore(true)
    fetchFromApi("posts", {
      ...fetchPostsParams,
      ["from"]: lastScrolled
      }, (data) => {
        setCanLoadMore(data.length === API_POST_LIMIT)
        // Concatenate the new posts into the shown posts.
        setShownPosts(shownPosts.concat(data))
        setLoadingMore(false)
      })
  }, [shownPosts, lastScrolled, canLoadMore, fetchPostsParams, sortBy])

  return useMemo(() => (
    shownPosts.length > 0 ? (
      <div className="relative">
        { isLoadingPosts && (
          <div className="absolute z-10 w-full h-full">
              <AiOutlineLoading className="animate-spin" />
          </div>
        )}
        <div className={`flex flex-col space-y-2 overflow-y-auto max-h-128 ${isLoadingPosts && 'opacity-50'}`}>
          {shownPosts.map(post => (
            <PostOverview post={post} />
          ))}
          <div className="flex flex-row justify-center w-full">
            { canLoadMore ? (
              <CuteButton onClick={loadMore} width="full" size="baseline" isDisabled={() => loadingMore}>
                  <AiOutlineLoading className={`animate-spin mr-2 ${!loadingMore && 'invisible'}`} />
                  Load more
              </CuteButton>
            ) : (
              <CuteButton width="full" size="baseline" isDisabled={() => true} textColor={"white"}>
                That's all
              </CuteButton>
            )}
          </div>
        </div>
      </div>
      ) : (selectedRange) ? (
        <div className="mt-2">No new posts to show in the selected range.</div>
      ) : (
        <div className="mt-2">Please select a range from the graph and select your sources from the left panel to see the posts.</div>
    )
  ), [shownPosts, canLoadMore, loadingMore, isLoadingPosts])
}