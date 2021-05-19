import {useEffect, useMemo, useState} from "react"
import {getPostCount, getPrice} from "./misc"
import {useApiData} from "../../api-hook"
import {max} from "d3-array"
import {scaleLinear} from "@vx/scale"

export const usePrices = (coinType, currentTime, minTime, maxTime, yMax) => {
  // Fetching the prices.
  const { result: prices, isLoading: isLoadingPrices } = useApiData([], "prices", {
    start: minTime,
    end: maxTime,
    type: coinType
  }, [currentTime], (params) => params[0] && params[1] && params[2] && params[0] !== params[1],
    (prices) => prices?.reverse())
  // Calculating the price scale.
  const priceScale = useMemo(() => {
    const high = max(prices, getPrice) || 0
    return scaleLinear({
      domain: [0, high + high/8],
      range: [yMax, 0]
    })
  }, [prices, yMax])
  return { prices, isLoadingPrices, priceScale }
}

export const usePostCounts = (coinType, currentTime, minTime, maxTime, sma, yMax) => {
  const { result: aggrPostCounts, isLoading: isLoadingOldPosts } = useApiData([], "aggregate/post_counts", {
    start: minTime,
    end: maxTime,
    type: coinType,
    sma: sma
  }, [currentTime], (params) => params[0] && params[1] && params[2] && params[3])
  const streamingRealtime = useMemo(() => true, [])
  // Fetching the realtime post counts.
  const { result: aggrStreamedPostCounts, isLoading: isLoadingStreamedPosts } = useApiData([], "aggregate/streamed_post_counts", {
    type: coinType
  }, [currentTime, streamingRealtime], (params) => params[0] && streamingRealtime)
  // Defining their merge.
  const [shownAggrPostCounts, setShownAggrPostCounts] = useState([])
  const isLoadingPostCounts = useMemo(() => isLoadingOldPosts || isLoadingStreamedPosts, [isLoadingOldPosts, isLoadingStreamedPosts])
  // Merge realtime and old post counts.
  useEffect(() => {
    if(isLoadingPostCounts) {
      setShownAggrPostCounts([])
      return
    }
    let merged = [...aggrPostCounts]
    if(streamingRealtime && aggrStreamedPostCounts.length > 0) {
      merged = [...aggrPostCounts, ...aggrStreamedPostCounts]
    }
    setShownAggrPostCounts(merged)
  }, [aggrPostCounts, aggrStreamedPostCounts, streamingRealtime, isLoadingPostCounts])

  // Calculate the post count scale.
  const postCountScale = useMemo(() => {
    const high = max(shownAggrPostCounts, getPostCount) || 0
    return scaleLinear({
      domain: [0, high],
      range: [yMax, 20]
    })
  }, [shownAggrPostCounts, yMax])

  return { postCounts: shownAggrPostCounts, isLoadingPostCounts, streamingRealtime, postCountScale }
}