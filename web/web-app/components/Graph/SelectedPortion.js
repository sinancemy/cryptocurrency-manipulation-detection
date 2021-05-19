import {useSelection} from "./misc"
import {AreaClosed, LinePath} from "@vx/shape"
import React, {useMemo} from "react"
import {tooltipColor} from "./colors"

export const SelectedPortion = ({ points, leftDate, rightDate, startDate, endDate, xscale, yscale, getX, getY,
                                  selectionFilledColor = "transparent",
                                  selectionStrokeColor = "transparent",
                                  selectionAreaBorderColor = "transparent",
                                  circleFillColor = "transparent" }) => {

  const {
    dragStartPoint,
    dragEndPoint,
    dragLeftPoint,
    dragRightPoint,
    selectedSlice
  } = useSelection(leftDate, rightDate, startDate, endDate, points)
  const xEnd = useMemo(() => xscale(getX(dragEndPoint)), [xscale, getX, dragEndPoint])
  const yStart = useMemo(() => yscale(getY(dragStartPoint)), [yscale, getY, dragStartPoint])
  const yEnd = useMemo(() => yscale(getY(dragEndPoint)), [yscale, getY, dragEndPoint])
  const percentChange = useMemo(() => yStart === 0 ? 0 : -100 * (yEnd - yStart) / yStart, [yStart, yEnd])

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
      {dragLeftPoint && (
        <g transform={`translate(${xscale(getX(dragLeftPoint))},
                                 ${yscale(getY(dragLeftPoint))})`}>
          <circle
            r={4}
            fill={circleFillColor}
            stroke="white"
            strokeWidth={2}
            pointerEvents="none"
          />
        </g>
      )}
      {dragRightPoint && (
        <circle
          cx={xscale(getX(dragRightPoint))}
          cy={yscale(getY(dragRightPoint))}
          r={4}
          fill={circleFillColor}
          stroke="white"
          strokeWidth={2}
          pointerEvents="none"
        />
      )}
      {(dragLeftPoint && dragRightPoint) && (
        <>
          <text x={xEnd} y={yEnd - 10} fill={"white"} fontSize={12}>
            { percentChange < 0 ? '-' : '+' } { Math.abs(percentChange).toFixed(0) }%
          </text>
        </>
      )}
    </g>
  )
}