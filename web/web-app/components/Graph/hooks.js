import {useEffect, useMemo, useState} from "react"
import {getPostCount, getPrice, timeExtentSeconds} from "./misc"
import {useApiData} from "../../api-hook"
import {max} from "d3-array"
import {scaleLinear} from "@vx/scale"

export const usePrices = (coinType, currentTime, timeExtent, yMax) => {
  // The price range that will be shown on the graph.
  const shownPriceRange = useMemo(() => {
    if(!timeExtent || !coinType) return [0, 0]
    const winHigh = currentTime
    const winLow = winHigh - timeExtentSeconds[timeExtent]
    return [winLow, winHigh]
  }, [timeExtent, currentTime, coinType])
  // Fetching the prices.
  const { result: prices, isLoading: isLoadingPrices } = useApiData([], "prices", {
    start: shownPriceRange[0],
    end: shownPriceRange[1],
    type: coinType
  }, [currentTime], (params) => params[0] !== params[1], (prices) => prices?.reverse())
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

export const usePostCounts = (coinType, currentTime, timeExtent, yMax) => {
  const { result: aggrPostCounts, isLoading: isLoadingOldPosts } = useApiData([], "aggregate/post_counts", {
    extent: timeExtent,
    type: coinType
  }, [currentTime], (params) => params[0] !== params[1])
  const streamingRealtime = useMemo(() => timeExtent === 'd' || timeExtent === 'w',
    [timeExtent])
  // Fetching the realtime post counts.
  const { result: aggrStreamedPostCounts, isLoading: isLoadingStreamedPosts } = useApiData([], "aggregate/streamed_post_counts", {
    type: coinType
  }, [currentTime], (params) => params[0] !== params[1] && streamingRealtime)
  // Defining their merge.
  const [shownAggrPostCounts, setShownAggrPostCounts] = useState([])
  const isLoadingPostCounts = useMemo(() => isLoadingOldPosts || isLoadingStreamedPosts, [isLoadingOldPosts, isLoadingStreamedPosts])
  // Merge realtime and old post counts.
  useEffect(() => {
    let merged = [...aggrPostCounts]
    if(streamingRealtime && aggrStreamedPostCounts.length > 0) {
      merged = [...aggrPostCounts, ...aggrStreamedPostCounts]
    }
    setShownAggrPostCounts(merged)
  }, [aggrPostCounts, aggrStreamedPostCounts, streamingRealtime])

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