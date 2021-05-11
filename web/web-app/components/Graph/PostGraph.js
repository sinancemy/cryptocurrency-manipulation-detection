import {Line, LinePath} from "@vx/shape"
import React, {useEffect, useMemo, useState} from "react"
import {tooltipColor, tooltipReflectionColor, volumeLineColor} from "./colors"
import {getDate, getPrice, useHover, useSelection} from "./misc"
import {max} from "d3-array"
import {scaleLinear} from "@vx/scale"
import {useApiData} from "../../api-hook"
import {SelectedPortion} from "./SelectedPortion"

const getAggrPostCountValue = (d) => !d ? 0 : d.sum

export const PostGraph = ({ width, height, coinType, currentTime, timeExtent, selectionWindow, lastEpoch,
                            hoveredDate, dragStartDate, dragEndDate, onSelected, onHover, onHoverExit, timeScale }) => {

  const yMax = height
  const xMax = width
  // Fetching the post counts.
  const { result: aggrPostCounts, isLoading: isLoadingPosts } = useApiData([], "aggregate/post_counts", {
    extent: timeExtent,
    type: coinType
  }, [timeScale], (params) => params[0] !== params[1])
  const shouldStreamRealtime = useMemo(() => timeExtent === 'd' || timeExtent === 'w',
    [timeExtent])
  // Fetching the realtime post counts.
  const { result: aggrStreamedPostCounts, isLoading: isLoadingStreamedPosts } = useApiData([], "aggregate/streamed_post_counts", {
    type: coinType
  }, [timeScale], (params) => params[0] !== params[1] && shouldStreamRealtime)
  // Defining their merge.
  const [shownAggrPostCounts, setShownAggrPostCounts] = useState([])
  const isLoading = useMemo(() => isLoadingPosts || isLoadingStreamedPosts, [isLoadingPosts, isLoadingStreamedPosts])

  // Count scale (y).
  const aggrPostCountScale = useMemo(() => {
    const high = max(shownAggrPostCounts, getAggrPostCountValue) || 0
    return scaleLinear({
      domain: [0, high],
      range: [yMax, 20]
    })
  }, [shownAggrPostCounts, yMax])

  useEffect(() => {
    let merged = [...aggrPostCounts]
    if(shouldStreamRealtime && aggrStreamedPostCounts.length > 0) {
      merged = [...aggrPostCounts, ...aggrStreamedPostCounts]
    }
    setShownAggrPostCounts(merged)
  }, [aggrPostCounts, aggrStreamedPostCounts, shouldStreamRealtime])

  const { hoveredPoint, hoveredSlice } = useHover(hoveredDate, shownAggrPostCounts, selectionWindow, timeExtent, onHover, onHoverExit)
  const isSelecting = useMemo(() => dragStartDate && dragEndDate, [dragStartDate, dragEndDate])

  return (
    <g>
      <LinePath
        data={shownAggrPostCounts}
        x={d => timeScale(getDate(d))}
        y={d => aggrPostCountScale(getAggrPostCountValue(d))}
        yScale={aggrPostCountScale}
        strokeWidth={2}
        stroke={isLoading ? 'gray' : volumeLineColor}
        opacity={isSelecting ? 0.2 : 0.8}
      />
      <SelectedPortion points={shownAggrPostCounts} startDate={dragStartDate} endDate={dragEndDate}
                       xScale={timeScale} yScale={aggrPostCountScale}
                       getY={getAggrPostCountValue} getX={getDate}
                       selectionStrokeColor={volumeLineColor} />
      {hoveredSlice && (
        <LinePath
          data={hoveredSlice}
          x={d => timeScale(getDate(d))}
          y={d => aggrPostCountScale(getAggrPostCountValue(d))}
          yScale={aggrPostCountScale}
          strokeWidth={2}
          stroke={tooltipReflectionColor}/>
      )}
      {hoveredPoint && (
        <circle
          cx={timeScale(hoveredDate)}
          cy={aggrPostCountScale(getAggrPostCountValue(hoveredPoint))}
          r={4}
          fill={tooltipColor}
          stroke="white"
          strokeWidth={2}
          pointerEvents="none"
        />
      )}
      {lastEpoch && shouldStreamRealtime && (
        <Line
          from={{ x: timeScale(lastEpoch), y: 0 }}
          to={{ x: timeScale(lastEpoch), y: yMax }}
          stroke={"green"}
          strokeWidth={2}
          opacity={0.8}
          pointerEvents="none"
          strokeDasharray="5,2"
        />
      )}
    </g>
  )
}