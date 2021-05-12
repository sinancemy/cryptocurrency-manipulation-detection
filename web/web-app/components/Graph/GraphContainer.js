import React, {useCallback, useEffect, useMemo, useRef, useState} from "react"
import {PriceGraph} from "./PriceGraph"
import {Bar} from "@vx/shape"
import {useApiData} from "../../api-hook"
import {PostGraph} from "./PostGraph"
import {localPoint} from "@vx/event"
import {scaleTime} from "@vx/scale"
import {calculatePoint, timeExtentSeconds, useMouseUpGlobal} from "./misc"
import {useDrag} from "./drag"
import {usePostCounts, usePrices} from "./data-hooks"
import {AiOutlineLoading} from "react-icons/ai"
import {GraphTooltip} from "./GraphTooltip"

export const GraphContainer = ({
                                 width, height, coinType, currentTime, timeExtent,
                                 onSelectedRange = () => {
                                 }
                               }) => {

  const {result: apiInfo} = useApiData(null, "info", [], [currentTime])

  // Calculate the global time scale.
  const globalTimeScale = useMemo(() => {
    if (!apiInfo) return null
    const maxTime = Math.min(apiInfo.last_streamed_post_update, currentTime)
    const minTime = Math.max(apiInfo.genesis, maxTime - timeExtentSeconds[timeExtent])
    return scaleTime({
      domain: [new Date(minTime * 1000), new Date(maxTime * 1000)],
      range: [0, width]
    })
  }, [apiInfo, timeExtent, width])

  // Hover stuff...
  const [hoveredX, setHoveredX] = useState(null)

  const handleHoverLeave = useCallback(() => {
    setHoveredX(null)
  }, [])

  const hoveredDate = useMemo(() => {
    if (!globalTimeScale || !hoveredX) return null
    return globalTimeScale.invert(hoveredX)
  }, [globalTimeScale, hoveredX])

  // Drag stuff...
  const {
    onMouseDownDrag,
    onMouseMoveDrag,
    onMouseUpDrag,
    minX,
    maxX,
    isDragging
  } = useDrag(width)

  // Handle click outside
  const graphContainerRef = useRef(null)
  useMouseUpGlobal(graphContainerRef, onMouseUpDrag)

  // Mouse move
  const handleMouseMove = (event) => {
    const {x} = localPoint(event) || {x: 0}
    setHoveredX(x)
    onMouseMoveDrag(event)
  }
  // Convert the drag points to dates.
  const dragStartDate = useMemo(() => {
    if (!minX || !globalTimeScale) return null
    return globalTimeScale.invert(minX * width)
  }, [minX, width, globalTimeScale])

  const dragEndDate = useMemo(() => {
    if (!maxX || !globalTimeScale) return null
    return globalTimeScale.invert(maxX * width)
  }, [maxX, width, globalTimeScale])

  // Invoke the callback when necessary.
  useEffect(() => {
    if (isDragging || !dragStartDate || !dragEndDate) return
    onSelectedRange(dragStartDate, dragEndDate)
  }, [dragStartDate, dragEndDate, isDragging])

  // Fetching the prices.
  const {prices, isLoadingPrices, priceScale} = usePrices(coinType, currentTime, timeExtent, height)

  // Fetching the post counts.
  const {postCounts, isLoadingPostCounts, postCountScale} = usePostCounts(coinType, currentTime, timeExtent, height)

  const isLoading = useMemo(() => isLoadingPrices || isLoadingPostCounts,
    [isLoadingPostCounts, isLoadingPrices])

  return (
    <div ref={graphContainerRef} className="relative">
      {isLoading && (
        <div className={"absolute top-2 left-2 animate-spin text-white"}>
          <AiOutlineLoading/>
        </div>
      )}
      <svg width={width} height={height}>
        <PriceGraph width={width} height={height}
                    prices={prices} priceScale={priceScale}
                    hoveredDate={hoveredDate}
                    dragStartDate={dragStartDate}
                    dragEndDate={dragEndDate}
                    timeScale={globalTimeScale}/>
        <PostGraph width={width} height={height}
                   postCounts={postCounts} postCountScale={postCountScale}
                   hoveredDate={hoveredDate}
                   dragStartDate={dragStartDate}
                   dragEndDate={dragEndDate}
                   lastEpoch={apiInfo ? new Date(apiInfo.last_epoch * 1000) : null}
                   timeScale={globalTimeScale}/>
        <Bar x={0} y={0} width={width} height={height}
             draggable={"true"}
             fill="transparent"
             onMouseMove={handleMouseMove}
             onMouseLeave={handleHoverLeave}
             onMouseDown={onMouseDownDrag}/>
      </svg>
      <GraphTooltip width={width} height={height} xMax={width}
                    xscale={globalTimeScale} date={hoveredDate}
                    priceScale={priceScale} postScale={postCountScale}
                    pricePoint={calculatePoint(hoveredDate, prices)}
                    postPoint={calculatePoint(hoveredDate, postCounts)}/>
    </div>
  )


}