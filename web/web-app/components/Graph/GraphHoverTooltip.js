import {Line} from "@vx/shape"
import {stockColor, tooltipColor, volumeLineColor} from "./colors"
import {getDate, getPostCount, getPrice} from "./misc"
import React from "react"

export const GraphHoverTooltip = ({ yMax, hoveredDate, timeScale, priceScale, postScale,
                                    hoveredPricePoint, hoveredPostPoint }) => {


  return (
    <g>
      <Line
        from={{ x: timeScale(hoveredDate), y: 0 }}
        to={{ x: timeScale(hoveredDate), y: yMax }}
        stroke={tooltipColor}
        strokeWidth={1}
        pointerEvents="none"
        strokeDasharray="5,2"
      />
      { hoveredPostPoint && (
      <circle
        cx={timeScale(hoveredDate)}
        cy={postScale(getPostCount(hoveredPostPoint))}
        r={4}
        fill={volumeLineColor}
        stroke="white"
        strokeWidth={2}
        pointerEvents="none"
      /> )}
      { hoveredPricePoint && (
      <circle
        cx={timeScale(hoveredDate)}
        cy={priceScale(getPrice(hoveredPricePoint))}
        r={4}
        fill={stockColor}
        stroke="white"
        strokeWidth={2}
        pointerEvents="none"
      /> )}
    </g>
  )
}