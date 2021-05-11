import {useSelection} from "./misc"
import {AreaClosed, Line, LinePath} from "@vx/shape"
import React, {useMemo} from "react"
import {tooltipColor} from "./colors"

export const SelectedPortion = ({ points, startDate, endDate, xscale, yscale, getX, getY,
                                  selectionFilledColor = "transparent",
                                  selectionStrokeColor = "transparent",
                                  selectionAreaBorderColor = "transparent"}) => {

  const { dragStartPoint, dragEndPoint, selectedSlice } = useSelection(startDate, endDate, points)
  const xStart = useMemo(() => xscale(getX(dragStartPoint)), [xscale, getX, dragStartPoint])
  const xEnd = useMemo(() => xscale(getX(dragEndPoint)), [xscale, getX, dragEndPoint])
  const yStart = useMemo(() => yscale(getY(dragStartPoint)), [yscale, getY, dragStartPoint])
  const yEnd = useMemo(() => yscale(getY(dragEndPoint)), [yscale, getY, dragEndPoint])
  const percentChange = useMemo(() => -100 * (yEnd - yStart) / yStart, [yStart, yEnd])

  return (
    <g>
      {selectedSlice && (
        <>
        <AreaClosed
          data={selectedSlice}
          x={d => xscale(getX(d))}
          y={d => yscale(getY(d))}
          yScale={yscale}
          fill={selectionFilledColor}
          strokeWidth={2}
          stroke={selectionAreaBorderColor}
          opacity={0.5}/>
        <LinePath
          data={selectedSlice}
          x={d => xscale(getX(d))}
          y={d => yscale(getY(d))}
          yScale={yscale}
          strokeWidth={2}
          stroke={selectionStrokeColor}
          opacity={0.5}
        />
        </>
      )}
      {dragStartPoint && (
        <g transform={`translate(${xscale(getX(dragStartPoint))},
                                 ${yscale(getY(dragStartPoint))})`}>
          <circle
            r={4}
            fill={tooltipColor}
            stroke="white"
            strokeWidth={1}
            pointerEvents="none"
          />
        </g>
      )}
      {dragEndPoint && (
        <circle
          cx={xscale(getX(dragEndPoint))}
          cy={yscale(getY(dragEndPoint))}
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
            from={{ x: xStart, y: yStart }}
            to={{ x: xEnd, y: yEnd }}
            stroke={tooltipColor}
            strokeWidth={1}
            pointerEvents="none"
          />
          <text x={(xStart + xEnd)/2} y={(yStart + yEnd)/2} fill={"white"} fontSize={12}>
            { percentChange.toFixed(0) }%
          </text>
        </>
      )}
    </g>
  )
}