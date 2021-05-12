import {Line, LinePath} from "@vx/shape"
import React from "react"
import {volumeLineColor} from "./colors"
import {getDate, getPostCount} from "./misc"

export const PostGraph = ({ width, height, lastEpoch, isDragging, timeScale, postCounts, postCountScale }) => {

  return (timeScale &&
    <g>
      <LinePath
        data={postCounts}
        x={d => timeScale(getDate(d))}
        y={d => postCountScale(getPostCount(d))}
        yScale={postCountScale}
        strokeWidth={2}
        stroke={volumeLineColor}
        opacity={isDragging ? 0.2 : 0.8}
      />
      {lastEpoch && (
        <Line
          from={{ x: timeScale(lastEpoch), y: 0 }}
          to={{ x: timeScale(lastEpoch), y: height }}
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