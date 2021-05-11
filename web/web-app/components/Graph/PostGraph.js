import {Line, LinePath} from "@vx/shape"
import React, {useMemo} from "react"
import {tooltipColor, tooltipReflectionColor, volumeLineColor} from "./colors"
import {getDate, getPostCount, useHover} from "./misc"
import {SelectedPortion} from "./SelectedPortion"

export const PostGraph = ({ width, height, lastEpoch, hoveredDate, dragStartDate, dragEndDate, timeScale, postCounts, postCountScale }) => {

  const yMax = height
  const xMax = width

  const { hoveredPoint, hoveredSlice } = useHover(hoveredDate, postCounts)
  const isSelecting = useMemo(() => dragStartDate && dragEndDate, [dragStartDate, dragEndDate])

  return (
    <g>
      <LinePath
        data={postCounts}
        x={d => timeScale(getDate(d))}
        y={d => postCountScale(getPostCount(d))}
        yScale={postCountScale}
        strokeWidth={2}
        stroke={volumeLineColor}
        opacity={isSelecting ? 0.2 : 0.8}
      />
      <SelectedPortion points={postCounts} startDate={dragStartDate} endDate={dragEndDate}
                       xscale={timeScale} yscale={postCountScale}
                       getY={getPostCount} getX={getDate}
                       selectionStrokeColor={volumeLineColor} />
      {hoveredSlice && (
        <LinePath
          data={hoveredSlice}
          x={d => timeScale(getDate(d))}
          y={d => postCountScale(getPostCount(d))}
          yScale={postCountScale}
          strokeWidth={2}
          stroke={tooltipReflectionColor}/>
      )}
      {hoveredPoint && (
        <circle
          cx={timeScale(hoveredDate)}
          cy={postCountScale(getPostCount(hoveredPoint))}
          r={4}
          fill={tooltipColor}
          stroke="white"
          strokeWidth={2}
          pointerEvents="none"
        />
      )}
      {lastEpoch && (
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