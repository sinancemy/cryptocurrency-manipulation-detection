import React, {useMemo} from 'react'
import {AreaClosed, Line, LinePath} from '@vx/shape'
import {scaleLinear, scaleTime} from '@vx/scale'
import {GridColumns, GridRows} from '@vx/grid'
import {max} from 'd3-array'
import {useApiData} from "../../api-hook"
import {SelectedPortion} from "./SelectedPortion"
import {gridColor, stockColor, stockStrokeColor, tooltipColor, tooltipReflectionColor} from "./colors"
import {
  getDate,
  getPrice,
  timeExtentSeconds,
  useHover,
} from "./misc"

export const PriceGraph = ({ width, height, coinType, currentTime, timeExtent, timeScale,
                             hoveredDate, dragStartDate, dragEndDate, onSelected }) => {
  const xMax = width
  const yMax = height
  // The price range that will be shown on the graph.
  const shownPriceRange = useMemo(() => {
    if(!timeExtent || !coinType) return [0, 0]
    const winHigh = currentTime
    const winLow = winHigh - timeExtentSeconds[timeExtent]
    return [winLow, winHigh]
  }, [timeExtent, currentTime, coinType])
  // Fetching the prices.
  const { result: prices, isLoading: isLoading } = useApiData([], "prices", {
    start: shownPriceRange[0],
    end: shownPriceRange[1],
    type: coinType
  }, [currentTime], (params) => params[0] !== params[1], (prices) => prices?.reverse())
  // Price scale.
  const priceScale = useMemo(() => {
    const high = max(prices, getPrice) || 0
    return scaleLinear({
      domain: [0, high + high/8],
      range: [yMax, 0]
    })
  }, [prices, yMax]);

  const { hoveredPoint } = useHover(hoveredDate, prices, timeExtent)
  const isSelecting = useMemo(() => dragStartDate && dragEndDate, [dragStartDate, dragEndDate])

  return  (
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
                       xScale={timeScale} yScale={priceScale}
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