import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { AreaClosed, Line, Bar, LinePath } from '@vx/shape';
import { curveMonotoneX } from '@vx/curve';
import { scaleTime, scaleLinear } from '@vx/scale';
import { GridRows, GridColumns } from '@vx/grid';
import { withTooltip, Tooltip, defaultStyles } from '@vx/tooltip';
import { WithTooltipProvidedProps } from '@vx/tooltip/lib/enhancers/withTooltip';
import { localPoint } from '@vx/event';
import { LinearGradient } from '@vx/gradient';
import { max, extent, bisector } from 'd3-array';
import { timeFormat } from 'd3-time-format';

export const background = '#3b6978';
export const background2 = '#204051';
export const accentColor = '#edffea';
export const gridColor = '#08141D'
export const accentColorDark = '#75daad';
export const accentColorMuted = '#5390A4'
export const selectedPortionColor = '#C20000'
const tooltipStyles = {
  ...defaultStyles,
  background,
  border: '1px solid white',
  color: 'white',
};

// util
const formatDate = timeFormat("%b %d, '%y");

// accessors
const getDate = (d) => new Date(d.time * 1000);
const getStockValue = (d) => d.price;
const bisectDate = bisector(d => new Date(d.time * 1000)).left;

const Graph = withTooltip(
  ({
    parentWidth,
    parentHeight,
    margin = { top: 0, right: 0, bottom: 0, left: 0 },
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipTop = 0,
    tooltipLeft = 0,
    graphSettings,
    selectedRange,
    setSelectedRange,
    loading,
    stock
  }) => {
    const width = parentWidth
    const height = parentHeight
    if (width < 10) return null;
    // bounds
    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;
    // scales
    const dateScale = useMemo(() => scaleTime({
        domain: extent(stock, getDate),
        range: [0, xMax],
      }), [stock, xMax]);
    const stockValueScale = useMemo(() => {
      const high = (max(stock, getStockValue) || 0)
      return scaleLinear({
        domain: [0, high + high/8],
        range: [yMax, 0]
      })
    }, [stock, yMax]);

    // Tooltip handler
    const handleTooltip = useCallback((event) => {
        const { x } = localPoint(event) || { x: 0 };
        const x0 = dateScale.invert(x);
        const index = bisectDate(stock, x0, 1);
        const d0 = stock[index - 1];
        const d1 = stock[index];
        let d = d0;
        if (d1 && getDate(d1)) {
          d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0;
        }
        // handle price window
        const pw0 = x0.valueOf() - (graphSettings.timeWindow/2) * 1000 * 60 * 60 * 24
        const pw1 = x0.valueOf() + (graphSettings.timeWindow/2) * 1000 * 60 * 60 * 24
        const i0 = bisectDate(stock, pw0)
        const i1 = bisectDate(stock, pw1)
        const data = {
          timeWindow: stock.slice(i0, i1),
          selectedPoint: d
        }
        showTooltip({
          tooltipData: data,
          tooltipLeft: x,
          tooltipTop: stockValueScale(getStockValue(d)),
        });
      },
      [showTooltip, stock, stockValueScale, dateScale, graphSettings],
    );

    // Selection handler
    const handleSelect = useCallback((event) => {
      const { x } = localPoint(event) || { x: 0 };
      const x0 = dateScale.invert(x);
      let d = getItemWithDate(x0)
      setSelectedRange({
        mid: d,
        midDate: getDate(d)
      })
    }, [graphSettings])

    const getItemWithDate = useCallback((date) => {
      if(stock.length == 1) {
        return stock[0]
      }
      const x0 = dateScale(date)
      let mid = bisectDate(stock, date)
      // Mid can be 0, especially when the date is out of bounds!
      if(mid == 0) mid += 1
      const d0 = stock[mid - 1];
      const d1 = stock[mid];
      let d = d0;
      if (d1 && getDate(d1)) {
        d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0;
      }
      return d
    }, [stock])

    const getSelectedRange = useCallback(() => {
        const d = selectedRange.midDate
        const pw0 = d.valueOf() - (graphSettings.timeWindow/2) * 1000 * 60 * 60 * 24
        const pw1 = d.valueOf() + (graphSettings.timeWindow/2) * 1000 * 60 * 60 * 24
        const i0 = bisectDate(stock, pw0)
        const i1 = bisectDate(stock, pw1)  
        return stock.slice(i0, i1)
    }, [graphSettings, selectedRange])

    const _min = (a, b) => (a < b) ? a : b
    const _max = (a, b) => (a > b) ? a : b

    return  (
      loading ? ( <div>Loading...</div> ) : (
      <div>
        <svg width={width} height={height} className="animate-blur-in">
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={14}
            fill="url(#area-background-gradient)"
          />
          <LinearGradient id="area-background-gradient" from={background} to={background2} />
          <LinearGradient id="area-gradient" from={accentColor} to={accentColor} toOpacity={0.1} />
          <GridRows
            scale={stockValueScale}
            width={xMax}
            strokeDasharray="3,3"
            stroke={gridColor}
            strokeOpacity={0.3}
            pointerEvents="none"
          />
          <GridColumns
            scale={dateScale}
            height={yMax}
            strokeDasharray="3,3"
            stroke={gridColor}
            strokeOpacity={0.3}
            pointerEvents="none"
          />
          {tooltipData && (
          <AreaClosed
            data={tooltipData.timeWindow}
            x={d => dateScale(getDate(d))}
            y={d => stockValueScale(getStockValue(d))}
            yScale={stockValueScale}
            strokeWidth={2}
            stroke="#A03605"
            fill="#A03605"
          />
          )}
          {selectedRange && (
          <AreaClosed
            data={getSelectedRange()}
            x={d => dateScale(getDate(d))}
            y={d => stockValueScale(getStockValue(d))}
            yScale={stockValueScale}
            strokeWidth={2}
            stroke={selectedPortionColor}
            fill={selectedPortionColor}
          />
          )}
          <AreaClosed
            data={stock}
            x={d => dateScale(getDate(d))}
            y={d => stockValueScale(getStockValue(d))}
            yScale={stockValueScale}
            strokeWidth={1}
            stroke="url(#area-gradient)"
            fill="url(#area-gradient)"
          />
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
                stroke={accentColorDark}
                strokeWidth={2}
                pointerEvents="none"
                strokeDasharray="5,2"
              />
              <circle
                cx={tooltipLeft}
                cy={tooltipTop + 1}
                r={4}
                fill="black"
                fillOpacity={0.1}
                stroke="black"
                strokeOpacity={0.1}
                strokeWidth={2}
                pointerEvents="none"
              />
              <circle
                cx={tooltipLeft}
                cy={tooltipTop}
                r={4}
                fill={accentColorDark}
                stroke="white"
                strokeWidth={2}
                pointerEvents="none"
              />
            </g>
          )}
          {selectedRange && (
            <g>
            <Line
              from={{ x: dateScale(selectedRange.midDate), y: 0 }}
              to={{ x: dateScale(selectedRange.midDate), y: yMax }}
              stroke={selectedPortionColor}
              strokeWidth={2}
              pointerEvents="none"
              strokeDasharray="5,2"
            />
              <circle
                cx={dateScale(selectedRange.midDate)}
                cy={stockValueScale(getStockValue(getItemWithDate(selectedRange.midDate))) + 1}
                r={4}
                fill="black"
                fillOpacity={0.1}
                stroke="black"
                strokeOpacity={0.1}
                strokeWidth={2}
                pointerEvents="none"
              />
              <circle
                cx={dateScale(selectedRange.midDate)}
                cy={stockValueScale(getStockValue(getItemWithDate(selectedRange.midDate)))}
                r={4}
                fill={selectedPortionColor}
                stroke="white"
                strokeWidth={2}
                pointerEvents="none"
              />
          </g>
          )}
        </svg>
        {tooltipData && (
          <div>
            <Tooltip 
              top={tooltipTop - 12} 
              left={_min(tooltipLeft + 12, xMax - 135)} 
              style={{
                ...tooltipStyles,
                width: 120,
                textAlign: 'center',
                opacity: 0.7
                }}>
              {`$${getStockValue(tooltipData.selectedPoint).toPrecision(5)}`}
            </Tooltip>
            <Tooltip
              top={yMax - 36}
              left={_max(0, _min(tooltipLeft - 60, xMax - 150))}
              style={{
                ...defaultStyles,
                textAlign: 'center',
                width: 120
              }}
            >
              {formatDate(getDate(tooltipData.selectedPoint))}
            </Tooltip>
          </div>
        )}
      </div>)
    );
  },
)

export default Graph