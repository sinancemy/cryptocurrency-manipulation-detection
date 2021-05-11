import {getDate, getPrice, useSelection} from "./misc"
import {AreaClosed, Line, LinePath} from "@vx/shape"
import React from "react"
import {stockColor, stockStrokeColor, tooltipColor, tooltipReflectionColor} from "./colors"

export const SelectedPortion = ({ points, startDate, endDate, xScale, yScale, getX, getY,
                                  selectionFilledColor = "transparent",
                                  selectionStrokeColor = "transparent",
                                  selectionAreaBorderColor = "transparent"}) => {

  const { dragStartPoint, dragEndPoint, selectedSlice } = useSelection(startDate, endDate, points)

  return (
    <g>
      {selectedSlice && (
        <>
        <AreaClosed
          data={selectedSlice}
          x={d => xScale(getX(d))}
          y={d => yScale(getY(d))}
          yScale={yScale}
          fill={selectionFilledColor}
          strokeWidth={2}
          stroke={selectionAreaBorderColor}
          opacity={0.5}/>
        <LinePath
          data={selectedSlice}
          x={d => xScale(getX(d))}
          y={d => yScale(getY(d))}
          yScale={yScale}
          strokeWidth={2}
          stroke={selectionStrokeColor}
          opacity={0.5}
        />
        </>
      )}
      {dragStartPoint && (
        <circle
          cx={xScale(getX(dragStartPoint))}
          cy={yScale(getY(dragStartPoint))}
          r={4}
          fill={tooltipColor}
          stroke="white"
          strokeWidth={1}
          pointerEvents="none"
        />
      )}
      {dragEndPoint && (
        <circle
          cx={xScale(getX(dragEndPoint))}
          cy={yScale(getY(dragEndPoint))}
          r={4}
          fill={tooltipColor}
          stroke="white"
          strokeWidth={2}
          pointerEvents="none"
        />
      )}
      {(dragStartPoint && dragEndPoint) && (
        <>
          <Line
            from={{ x: xScale(getX(dragStartPoint)), y: yScale(getY(dragStartPoint)) }}
            to={{ x: xScale(getX(dragEndPoint)), y: yScale(getY(dragEndPoint)) }}
            stroke={tooltipColor}
            strokeWidth={1}
            pointerEvents="none"
          />
        </>
      )}
    </g>
  )
}