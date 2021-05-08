import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { AreaClosed, Line, Bar, LinePath } from '@vx/shape';
import { scaleTime, scaleLinear } from '@vx/scale';
import { GridRows, GridColumns } from '@vx/grid';
import { withTooltip, Tooltip, defaultStyles, useTooltip } from '@vx/tooltip';
import { localPoint } from '@vx/event';
import { max, extent, bisector } from 'd3-array';
import { timeFormat } from 'd3-time-format';
import { useApiData } from "../api-hook"
import { Glyph } from '@vx/glyph';
import { AiOutlineArrowUp, AiOutlineLoading } from 'react-icons/ai'
import { getImpactColor, getImpactIconGraph } from '../Helpers';

export const background = 'transparent';
export const stockColor = '#1F85DE';
export const stockStrokeColor = "white"
export const gridColor = '#fff';
export const selectionColor = 'orange';
export const tooltipColor = "orange";
export const tooltipReflectionColor = "orange"
export const volumeLineColor = "red"
const tooltipStyles = {
  ...defaultStyles,
  background,
  border: '1px solid white',
  color: 'white',
};

// util
const formatDate = timeFormat("%b %d, '%y");

// accessors
const getDate = (d) => !d ? new Date(0) : new Date(d.time * 1000);
const getStockValue = (d) => !d ? 0 : d.price
const getPostVolumeValue = (d) => !d ? 0 : d.sum
const bisectDate = bisector(d => !d ? new Date(1000) : new Date(d.time * 1000)).left;

const timeExtentMap = {
  "d": 1,
  "w": 7,
  "m": 30,
  "y": 365,
}

export const Graph = ({ width, height, coinType, currentTime, timeExtent, timeWindow, showPostVolume = true, onSelected = () => true }) => {
    const { showTooltip, hideTooltip, tooltipData, tooltipTop, tooltipLeft } = useTooltip()
    // bounds
    if (width < 10) return null
    const xMax = width
    const yMax = height
    // The price range that will be shown on the graph.
    const shownPriceRange = useMemo(() => {
      if(!timeExtent || !coinType) return [0, 0]
      const decrement = 60 * 60 * 24 * timeExtentMap[timeExtent]
      const winHigh = currentTime
      const winLow = winHigh - decrement
      return [winLow, winHigh]
    }, [timeExtent, currentTime, coinType])
    // Fetching the prices.
    const { result: stock, isLoading: stockLoading } = useApiData([], "prices", {
      start: shownPriceRange[0],
      end: shownPriceRange[1],
      type: coinType
    }, [], (params) => params[0] !== params[1], (prices) => prices?.reverse())
    // Fetching the aggregate post counts.
    const { result: postVolume, isLoading: postVolumeLoading } = useApiData([], "aggregate/post_counts", {
      start: shownPriceRange[0],
      end: shownPriceRange[1],
      type: coinType
    }, [], (params) => params[0] !== params[1] && showPostVolume)
    // Fetching the aggregate impacts.
    const { result: aggrImpacts, isLoading: aggrImpactsLoading } = useApiData([], "aggregate/post_impacts", {
      start: shownPriceRange[0],
      end: shownPriceRange[1],
      type: coinType
    }, [], (params) => false && params[0] !== params[1])

    const [cleanedAggrImpacts, setCleanedAggrImpacts] = useState([])
    const isLoading = useMemo(() => stockLoading || postVolumeLoading || aggrImpactsLoading, 
      [stockLoading, postVolumeLoading, aggrImpactsLoading])

    useEffect(() => {
      const cleaned = []
      for(var i = 0; i < aggrImpacts.length; i += 50) {
        cleaned.push(aggrImpacts[i])
      }
      setCleanedAggrImpacts(cleaned)
    }, [aggrImpacts])

    // scales
    const dateScale = useMemo(() => scaleTime({
        domain: extent(stock, getDate),
        range: [0, xMax],
      }), [stock, xMax]);
    const stockValueScale = useMemo(() => {
      const high = max(stock, getStockValue) || 0
      return scaleLinear({
        domain: [0, high + high/8],
        range: [yMax, 0]
      })
    }, [stock, yMax]);
    const postVolumeScale = useMemo(() => {
      const high = max(postVolume, getPostVolumeValue) || 0
      return scaleLinear({
        domain: [0, high + high/8],
        range: [yMax+1, 0]
      })
    }, [postVolume, yMax])
    // Tooltip handler
    const handleTooltip = useCallback((event) => {
        const { x } = localPoint(event) || { x: 0 };
        const x0 = dateScale.invert(x);
        // Find selected price point.
        const index = bisectDate(stock, x0, 1);
        const d0 = stock[index - 1];
        const d1 = stock[index];
        let d = d0;
        if (d1 && getDate(d1)) {
          d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0;
        }
        // Find selected volume point.
        const volIndex = bisectDate(postVolume, x0, 1);
        const vd0 = postVolume[volIndex - 1];
        const vd1 = postVolume[volIndex];
        let vd = vd0;
        if (vd1 && getDate(vd1)) {
          vd = x0.valueOf() - getDate(vd0).valueOf() > getDate(vd1).valueOf() - x0.valueOf() ? vd1 : vd0;
        }
        // Handle the time window.
        const tw0 = x0.valueOf() - (timeWindow/2) * 1000 * 60 * 60 * 24
        const tw1 = x0.valueOf() + (timeWindow/2) * 1000 * 60 * 60 * 24
        const pricei0 = bisectDate(stock, tw0)
        const pricei1 = bisectDate(stock, tw1)
        const volumei0 = bisectDate(postVolume, tw0)
        const volumei1 = bisectDate(postVolume, tw1)
        const data = {
          priceTimeWindow: stock.slice(pricei0, pricei1),
          volumeTimeWindow: postVolume.slice(volumei0, volumei1),
          selectedVolumePoint: vd,
          selectedPoint: d
        }
        showTooltip({
          tooltipData: data,
          tooltipLeft: x,
          tooltipTop: [stockValueScale(getStockValue(d)), postVolumeScale(getPostVolumeValue(vd))],
        });
      },
      [showTooltip, stock, postVolume, stockValueScale, postVolumeScale, dateScale, timeWindow],
    );
    const getPointWithDate = useCallback((list, date) => {
      if(list.length == 1) return list[0]
      let index = bisectDate(list, date)
      let d = list[index]
      return d
    })
    const getPricePointWithDate = useCallback((date) => getPointWithDate(stock, date), [stock])
    const getVolumePointWithDate = useCallback((date) => getPointWithDate(postVolume, date), [postVolume])
    // Selection stuff...
    const [selectedDate, setSelectedDate] = useState(null)
    // Selection handler
    const handleSelect = useCallback(() => {
      if(timeWindow === 0) return
      const midDate = getDate(tooltipData.selectedPoint)
      setSelectedDate(midDate)
    }, [dateScale, tooltipData])

    const getRangeIndices = (date, list) => {
      const d = date
      const pw0 = d.valueOf() - (timeWindow/2) * 1000 * 60 * 60 * 24
      const pw1 = d.valueOf() + (timeWindow/2) * 1000 * 60 * 60 * 24
      const i0 = bisectDate(list, pw0, 0, list.length-1)
      const i1 = bisectDate(list, pw1, 0, list.length-1)
      return [i0, i1]
    }
    
    const selectedRange = useMemo(() => {
      if(!selectedDate) return [0, 0]
      const [i0, i1] = getRangeIndices(selectedDate, stock)
      return [getDate(stock[i0]), getDate(stock[i1])]
    }, [selectedDate, timeWindow])

    useEffect(() => {
      if(!selectedRange) onSelected(null)
      const midVolume  = getVolumePointWithDate(selectedDate)
      const mid = getPricePointWithDate(selectedDate)
      onSelected({ mid: mid, midVolume: midVolume, midDate: selectedDate, selectedRange: selectedRange })
    }, [selectedRange])
    // Clearing the selection.
    useEffect(() => {
      setSelectedDate(null)
    }, [timeExtent])

    const getSelectedRange = useCallback((volume = false) => {
        const [i0, i1] = getRangeIndices(selectedDate, volume ? postVolume : stock)
        return volume ? postVolume.slice(i0, i1) : stock.slice(i0, i1)
    }, [timeWindow, selectedDate, postVolume, stock])

    // const renderDependencies = [stock, postVolume, tooltipData, width, height, coinType, currentTime, timeExtent, timeWindow, showPostVolume]
    return  (
      <div className="relative">
        { isLoading && (
        <div className="absolute w-full h-full left-1 top-1 z-10 text-white">
          <AiOutlineLoading className="animate-spin" />
        </div>
        )}
        <svg width={width} height={height}>
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="transparent"
          />
          <GridRows
            scale={stockValueScale}
            width={xMax}
            strokeDasharray="3,3"
            stroke={gridColor}
            strokeOpacity={0.3}
            pointerEvents="none"/>
          <GridColumns
            scale={dateScale}
            height={yMax}
            strokeDasharray="3,3"
            stroke={gridColor}
            strokeOpacity={0.3}
            pointerEvents="none"/>
          <AreaClosed
            data={stock}
            x={d => dateScale(getDate(d))}
            y={d => stockValueScale(getStockValue(d))}
            yScale={stockValueScale}
            strokeWidth={2}
            stroke={stockStrokeColor}
            fill={stockColor}
            opacity={0.5}/>
          { cleanedAggrImpacts.map((aggrImpact, i) => {
            const x = dateScale(getDate(aggrImpact))
            const y = 30
            return (
              <Glyph left={x} top={y}>
                  { getImpactIconGraph(aggrImpact.avg) }
              </Glyph>
            )
          }) }
          {tooltipData && (
          <LinePath
            data={tooltipData.priceTimeWindow}
            x={d => dateScale(getDate(d))}
            y={d => stockValueScale(getStockValue(d))}
            yScale={stockValueScale}
            strokeWidth={2}
            stroke={tooltipReflectionColor}/>
          )}
          {selectedDate && (
          <LinePath
            data={getSelectedRange()}
            x={d => dateScale(getDate(d))}
            y={d => stockValueScale(getStockValue(d))}
            yScale={stockValueScale}
            strokeWidth={2}
            stroke={selectionColor}/>
          )}
          {showPostVolume && (
            <>
            <LinePath
              data={postVolume}
              x={d => dateScale(getDate(d))}
              y={d => postVolumeScale(getPostVolumeValue(d))}
              yScale={postVolumeScale}
              strokeWidth={1}
              stroke={volumeLineColor}
              opacity={0.8}
            />
            { tooltipData && (
              <LinePath
                data={tooltipData.volumeTimeWindow}
                x={d => dateScale(getDate(d))}
                y={d => postVolumeScale(getPostVolumeValue(d))}
                yScale={postVolumeScale}
                strokeWidth={2}
                stroke={tooltipReflectionColor}
                opacity={0.8}
                fill="transparent"
              /> 
            )}
            { selectedDate && (
              <LinePath
                data={getSelectedRange(true)}
                x={d => dateScale(getDate(d))}
                y={d => postVolumeScale(getPostVolumeValue(d))}
                yScale={postVolumeScale}
                strokeWidth={2}
                stroke={selectionColor}
                opacity={0.8}
                fill="transparent"
              /> 
            )}
          </>
          )}
          <Bar
            x={0}
            y={0}
            width={width}
            height={height}
            fill="transparent"
            rx={14}
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={hideTooltip}
            onClick={(event) => {
                if(tooltipData) {
                    handleSelect(event)
                }
            }}
          />
          {tooltipData && (
            <g>
              <Line
                from={{ x: tooltipLeft, y: 0 }}
                to={{ x: tooltipLeft, y: yMax }}
                stroke={tooltipColor}
                strokeWidth={1}
                pointerEvents="none"
                strokeDasharray="5,2"
              />
              <circle
                cx={tooltipLeft}
                cy={tooltipTop[0]}
                r={4}
                fill={tooltipColor}
                stroke="white"
                strokeWidth={2}
                pointerEvents="none"
              />
              {showPostVolume && (
                <circle
                  cx={tooltipLeft}
                  cy={tooltipTop[1]}
                  r={4}
                  fill={tooltipColor}
                  stroke="white"
                  strokeWidth={2}
                  pointerEvents="none"
                />
              )}
            </g>
          )}
          {selectedDate && (
            <g>
              <Line
                from={{ x: dateScale(selectedDate), y: 0 }}
                to={{ x: dateScale(selectedDate), y: yMax }}
                stroke={selectionColor}
                strokeWidth={1}
                pointerEvents="none"
                strokeDasharray="5,2"
              />
              <circle
                cx={dateScale(selectedDate)}
                cy={stockValueScale(getStockValue(getPricePointWithDate(selectedDate)))}
                r={4}
                fill={selectionColor}
                stroke="white"
                strokeWidth={2}
                pointerEvents="none"
              />
              {showPostVolume && (
                  <circle
                    cx={dateScale(selectedDate)}
                    cy={postVolumeScale(getPostVolumeValue(getVolumePointWithDate(selectedDate)))}
                    r={4}
                    fill={selectionColor}
                    stroke="white"
                    strokeWidth={2}
                    pointerEvents="none"
                  />
              )}
            </g>
          )}
        </svg>
        {tooltipData && (
          <div>
            <Tooltip
              top={yMax - 36}
              left={Math.max(0, Math.min(tooltipLeft - 60, xMax - 150))}
              style={{
                ...defaultStyles,
                textAlign: 'center',
                width: 120
              }} >
              {formatDate(getDate(tooltipData.selectedPoint))}
            </Tooltip>
            <Tooltip 
              top={12} 
              left={Math.min(tooltipLeft + 12, xMax - 135)} 
              style={{
                ...tooltipStyles,
                width: 120,
                opacity: 0.7
                }}>
              <div className="flex flex-col">
                <span>
                  Price: ${getStockValue(tooltipData.selectedPoint).toPrecision(5)}
                </span>
              { showPostVolume && (
                <span>
                 Posts(new): {getPostVolumeValue(tooltipData.selectedVolumePoint)} {" "} 
                </span>
              )}
              </div>
            </Tooltip>

          </div>
        )}
      </div>
  )
}