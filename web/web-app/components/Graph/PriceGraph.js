import React, {useMemo} from 'react'
import {AreaClosed, Line} from '@vx/shape'
import {scaleLinear} from '@vx/scale'
import {GridColumns, GridRows} from '@vx/grid'
import {max} from 'd3-array'
import {SelectedPortion} from "./SelectedPortion"
import {gridColor, stockColor, stockStrokeColor, tooltipColor, tooltipReflectionColor} from "./colors"
import {
  getDate,
  getPrice,
  useHover,
} from "./misc"

export const PriceGraph = ({ width, height, timeScale, hoveredDate, dragStartDate, dragEndDate, prices, priceScale }) => {
  const xMax = width
  const yMax = height

  const { hoveredPoint } = useHover(hoveredDate, prices)
  const isSelecting = useMemo(() => dragStartDate && dragEndDate, [dragStartDate, dragEndDate])

  return  (timeScale &&
    <g>
      <GridRows
        scale={priceScale}
        width={xMax}
        strokeDasharray="3,3"
        stroke={gridColor}
        strokeOpacity={0.3}
        pointerEvents="none"/>
      <GridColumns
        scale={timeScale}
        height={yMax}
        strokeDasharray="3,3"
        stroke={gridColor}
        strokeOpacity={0.3}
        pointerEvents="none"/>
      <AreaClosed
        data={prices}
        x={d => timeScale(getDate(d))}
        y={d => priceScale(getPrice(d))}
        yScale={priceScale}
        strokeWidth={2}
        stroke={stockStrokeColor}
        fill={stockColor}
        opacity={isSelecting ? 0.1 : 0.5}/>
      <SelectedPortion points={prices} startDate={dragStartDate} endDate={dragEndDate}
                       xscale={timeScale} yscale={priceScale}
                       getY={getPrice} getX={getDate}
                       selectionFilledColor={stockColor}
                       selectionAreaBorderColor={stockStrokeColor}/>
      {hoveredPoint && (
      <g>
        <Line
          from={{ x: timeScale(hoveredDate), y: 0 }}
          to={{ x: timeScale(hoveredDate), y: yMax }}
          stroke={tooltipColor}
          strokeWidth={1}
          pointerEvents="none"
          strokeDasharray="5,2"
        />
        <circle
          cx={timeScale(getDate(hoveredPoint))}
          cy={priceScale(getPrice(hoveredPoint))}
          r={4}
          fill={tooltipColor}
          stroke="white"
          strokeWidth={2}
          pointerEvents="none"
        />
      </g>
      )}
    </g>
  )
}