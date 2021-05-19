import React from 'react'
import {AreaClosed} from '@vx/shape'
import {GridColumns, GridRows} from '@vx/grid'
import {gridColor, stockColor, stockStrokeColor} from "./colors"
import {getDate, getPrice} from "./misc"

export const PriceGraph = ({ width, height, timeScale, isDragging, prices, priceScale }) => {
  return  (timeScale &&
    <g>
      <GridRows
        scale={priceScale}
        width={width}
        strokeDasharray="3,3"
        stroke={gridColor}
        strokeOpacity={0.3}
        pointerEvents="none"/>
      <GridColumns
        scale={timeScale}
        height={height}
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
        opacity={isDragging ? 0.1 : 0.5}/>
    </g>
  )
}