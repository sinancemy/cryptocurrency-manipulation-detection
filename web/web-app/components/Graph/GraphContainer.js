import React, {useCallback, useEffect, useMemo, useState} from "react"
import {PriceGraph} from "./PriceGraph"
import {Bar} from "@vx/shape"
import {useApiData} from "../../api-hook"
import {PostGraph} from "./PostGraph"
import {localPoint} from "@vx/event"
import {scaleTime} from "@vx/scale"
import {timeExtentSeconds} from "./misc"
import {useDrag} from "./drag"

export const GraphContainer = ({ width, height, coinType, currentTime, timeExtent,
                                 onSelectedRange = () => {}}) => {

  const { result: apiInfo } = useApiData(null, "info", [], [currentTime])

  // Calculate the global time scale.
  const globalTimeScale = useMemo(() => {
    if(!apiInfo) return null
    const maxTime = Math.min(apiInfo.last_streamed_post_update, currentTime)
    const minTime = Math.max(apiInfo.genesis, maxTime - timeExtentSeconds[timeExtent])
    return scaleTime({
      domain: [new Date(minTime*1000), new Date(maxTime*1000)],
      range: [0, width],
    })
  }, [apiInfo, timeExtent, width])

  // Hover stuff...
  const [hover, setHover] = useState(false)
  const [hoveredX, setHoveredX] = useState(null)

  const handleHoverLeave = useCallback(() => {
    setHover(false)
    setHoveredX(null)
  }, [])

  const hoveredDate = useMemo(() => {
    if(!globalTimeScale || !hoveredX) return null
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

  // Mouse move
  const handleMouseMove = (event) => {
    const {x} = localPoint(event) || {x: 0}
    setHover(true)
    setHoveredX(x)
    onMouseMoveDrag(event)
  }
  // Convert the drag points to dates.
  const dragStartDate = useMemo(() => {
    if (!minX) return null
    return globalTimeScale.invert(minX * width)
  }, [minX, width, globalTimeScale])

  const dragEndDate = useMemo(() => {
    if (!maxX) return null
    return globalTimeScale.invert(maxX * width)
  }, [maxX, width, globalTimeScale])

  // Invoke the callback when necessary.
  useEffect(() => {
    if(isDragging || !dragStartDate || !dragEndDate) return
    onSelectedRange(dragStartDate, dragEndDate)
  }, [dragStartDate, dragEndDate, isDragging])

  return (apiInfo &&
    <div className="relative">
      <svg width={width} height={height}>
        <PriceGraph width={width} height={height} coinType={coinType}
            currentTime={currentTime} timeExtent={timeExtent}
            hoveredDate={hoveredDate}
            dragStartDate={dragStartDate}
            dragEndDate={dragEndDate}
            timeScale={globalTimeScale}/>
        <PostGraph width={width} height={height} coinType={coinType}
            currentTime={currentTime} timeExtent={timeExtent}
            hoveredDate={hoveredDate}
            dragStartDate={dragStartDate}
            dragEndDate={dragEndDate}
            lastEpoch={new Date(apiInfo.last_epoch * 1000)}
            onSelected={() => {}}
            timeScale={globalTimeScale}/>
          <Bar x={0} y={0} width={width} height={height}
            draggable={"true"}
            fill="transparent"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleHoverLeave}
            onMouseDown={onMouseDownDrag}
            onMouseUp={onMouseUpDrag} />
      </svg>
    </div>
  )


}