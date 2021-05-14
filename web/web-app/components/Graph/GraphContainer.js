import React, {useCallback, useEffect, useMemo, useRef, useState} from "react"
import {PriceGraph} from "./PriceGraph"
import {Bar} from "@vx/shape"
import {PostGraph} from "./PostGraph"
import {localPoint} from "@vx/event"
import {scaleTime} from "@vx/scale"
import {getDate, getPostCount, getPrice, useHover, useMouseUpGlobal} from "./misc"
import {useDrag} from "./drag"
import {usePostCounts, usePrices} from "./data-hooks"
import {AiOutlineLoading} from "react-icons/ai"
import {GraphTooltip} from "./GraphTooltip"
import {SelectedPortion} from "./SelectedPortion"
import {stockColor, stockStrokeColor, volumeLineColor} from "./colors"
import {GraphHoverTooltip} from "./GraphHoverTooltip"

export const GraphContainer = ({ apiInfo, width, height, coinType, currentTime, timeExtent, sma,
                                 onSelectedRange = () => {} }) => {

  const maxTime = useMemo(() => {
    if(!apiInfo) return null
    return apiInfo.last_streamed_post_update
  }, [apiInfo])
  const minTime = useMemo(() => {
    if(!apiInfo || !timeExtent || !maxTime) return null
    return Math.max(apiInfo.genesis, maxTime - apiInfo.available_settings.extents[timeExtent])
  }, [apiInfo, maxTime, timeExtent])
  // Calculate the global time scale.
  const globalTimeScale = useMemo(() => {
    if (!minTime || !maxTime) return null
    return scaleTime({
      domain: [new Date(maxTime * 1000), new Date(minTime * 1000)],
      range: [width, 0]
    })
  }, [minTime, maxTime])

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
    leftX,
    rightX,
    startX,
    endX,
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
  const xToDate = useCallback((x) => {
    if(!x || !globalTimeScale) return null
    return globalTimeScale.invert(x * width)
  }, [globalTimeScale, width])
  const dragStartDate = useMemo(() => xToDate(startX), [startX])
  const dragEndDate = useMemo(() => xToDate(endX), [endX])
  const dragLeftDate = useMemo(() => xToDate(leftX), [leftX])
  const dragRightDate = useMemo(() => xToDate(rightX), [rightX])

  // Invoke the callback when necessary.
  useEffect(() => {
    if (isDragging || !dragLeftDate || !dragRightDate) return
    onSelectedRange(dragLeftDate, dragRightDate)
  }, [globalTimeScale, dragLeftDate, dragRightDate, isDragging])

  // Fetching the prices.
  const {prices, isLoadingPrices, priceScale} = usePrices(coinType, currentTime, minTime, maxTime, height)

  // Fetching the post counts.
  const {postCounts, isLoadingPostCounts, postCountScale} = usePostCounts(coinType, currentTime, minTime, maxTime, sma, height)

  const isLoading = useMemo(() => isLoadingPrices || isLoadingPostCounts,
    [isLoadingPostCounts, isLoadingPrices])

  const { hoveredPoint: hoveredPricePoint } = useHover(hoveredDate, prices)
  const { hoveredPoint: hoveredPostPoint } = useHover(hoveredDate, postCounts)

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
                    isDragging={isDragging}
                    timeScale={globalTimeScale}/>
        <PostGraph width={width} height={height}
                   postCounts={postCounts} postCountScale={postCountScale}
                   isDragging={isDragging}
                   lastEpoch={apiInfo ? new Date(apiInfo.last_epoch * 1000) : null}
                   timeScale={globalTimeScale}/>
        { globalTimeScale && (
        <>
          <SelectedPortion points={prices}
                           leftDate={dragLeftDate} rightDate={dragRightDate}
                           startDate={dragStartDate} endDate={dragEndDate}
                           xscale={globalTimeScale} yscale={priceScale}
                           getY={getPrice} getX={getDate}
                           selectionFilledColor={stockColor}
                           selectionAreaBorderColor={stockStrokeColor}
                           circleFillColor={stockColor} />
          <SelectedPortion points={postCounts}
                           leftDate={dragLeftDate} rightDate={dragRightDate}
                           startDate={dragStartDate} endDate={dragEndDate}
                           xscale={globalTimeScale} yscale={postCountScale}
                           getY={getPostCount} getX={getDate}
                           selectionStrokeColor={volumeLineColor}
                           circleFillColor={volumeLineColor} />
          </>
          )}
        { hoveredDate && (
          <GraphHoverTooltip yMax={height} postScale={postCountScale} priceScale={priceScale}
                             timeScale={globalTimeScale} hoveredDate={hoveredDate}
                             hoveredPricePoint={hoveredPricePoint}
                             hoveredPostPoint={hoveredPostPoint}/>
        )}
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
                    pricePoint={hoveredPricePoint}
                    postPoint={hoveredPostPoint}/>
    </div>
  )


}