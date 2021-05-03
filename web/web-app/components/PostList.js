import { useCallback, useEffect, useMemo, useState } from "react"
import { fetchFromApi, useApiData, useTraceUpdate } from "../api-hook"
import { CuteButton } from "./CuteButton"
import { PostOverview } from "./PostOverview"
import { AiOutlineLoading } from "react-icons/ai"

const API_POST_LIMIT = 50

export const PostList = ({ selectedRange = [-1, -1], coinType = "btc", selectedSources = [], sortBy, sortOrder,  
                            showIrrelevant = false, allSources = false, onUpdate = (posts) => {} }) => {
  
  const [shownPosts, setShownPosts] = useState([])
  const [canLoadMore, setCanLoadMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(true)
  // Indicating changes in which states will result in a refetch of the posts.
  const fetchPostsDependencies = [allSources, showIrrelevant, coinType, selectedSources, selectedRange, sortBy, sortOrder]
  const fetchPostsParams = useMemo(() => {
    return {
      source: !allSources ? selectedSources.join(";") : null,
      type: !showIrrelevant ? coinType : null,
      start: selectedRange ? selectedRange[0] : null,
      end: selectedRange ? selectedRange[1] : null,
      sort: sortBy,
      desc: sortOrder === "descending" ? 1 : 0
    }
  }, fetchPostsDependencies)
  // Indicating when to refetch the posts.
  const shouldRefetchPosts = useCallback(() => {
    return !(!showIrrelevant && !coinType) && !(!allSources && selectedSources.length === 0) && !(selectedRange && selectedRange[0] < 0)
  }, [coinType, allSources, selectedSources, selectedRange])  
  // Fetching the posts (initializer).
  const posts = useApiData([], "posts", fetchPostsParams, fetchPostsDependencies, shouldRefetchPosts)
  // Move to the shown posts.
  useEffect(() => {
    if(!posts) return
    setCanLoadMore(posts.length === API_POST_LIMIT)
    setLoadingMore(false)
    setShownPosts(posts)
  }, [posts])
  // Clear the shown posts on any change.
  useEffect(() => {
    setShownPosts([])
  }, [selectedRange, coinType, selectedSources, sortBy, sortOrder, showIrrelevant, allSources])
  // Invoke the callback.
  useEffect(() => {
    onUpdate(shownPosts)
  }, [shownPosts])

  const lastScrolled = useMemo(() => {
    if(!shownPosts || shownPosts.length === 0) return 0
    const last = shownPosts[shownPosts.length-1]
    return (sortBy === "time") ? last.time
          : (sortBy === "interaction") ? last.interaction
          : (sortBy === "user") ? last.user
          : 0
  }, [shownPosts, sortBy])

  const loadMore = useCallback(() => {
    if(!canLoadMore) return
    setLoadingMore(true)
    fetchFromApi("posts", {
      ...fetchPostsParams,
      ["from_" + sortBy]: lastScrolled
      }, (data) => {
        setCanLoadMore(data.length === API_POST_LIMIT)
        // Concatenate the new posts into the shown posts.
        setShownPosts(shownPosts.concat(data))
        setLoadingMore(false)
      })
  }, [shownPosts, lastScrolled, canLoadMore, fetchPostsParams, sortBy])

  return useMemo(() => (
    <>
    {shownPosts.length > 0 ? (
      <div className="overflow-y-auto max-h-128">
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
      ) : (selectedRange) ? (
        <div className="mt-2">No new posts to show in the selected range.</div>
      ) : (
        <div className="mt-2">Please select a range from the graph and select your sources from the left panel to see the posts.</div>
    )}
    </>
  ), [shownPosts])
}