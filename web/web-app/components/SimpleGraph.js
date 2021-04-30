import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { AreaClosed, Line, Bar, LinePath } from '@vx/shape';
import { scaleTime, scaleLinear } from '@vx/scale';
import { GridRows, GridColumns } from '@vx/grid';
import { withTooltip, Tooltip, defaultStyles } from '@vx/tooltip';
import { localPoint } from '@vx/event';
import { max, extent, bisector } from 'd3-array';
import { timeFormat } from 'd3-time-format';

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
const getDate = (d) => new Date(d.time * 1000);
const getStockValue = (d) => d.price;
const bisectDate = bisector(d => new Date(d.time * 1000)).left;

export const SimpleGraph = withTooltip(
  ({
    parentWidth,
    parentHeight,
    margin = { top: 0, right: 0, bottom: 0, left: 0 },
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipTop = [0, 0],
    tooltipLeft = 0,
    lastPrice,
    stock}) => {
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
      const high = max(stock, getStockValue) || 0
      return scaleLinear({
        domain: [0, high + high/8],
        range: [yMax, 0]
      })
    }, [stock, yMax]);

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
        const data = {
          selectedPoint: d
        }
        showTooltip({
          tooltipData: data,
          tooltipLeft: x,
          tooltipTop: stockValueScale(getStockValue(d)),
        });
      },
      [showTooltip, stock, stockValueScale, dateScale],
    );

    const _min = (a, b) => (a < b) ? a : b
    const _max = (a, b) => (a > b) ? a : b

    return  (stock && lastPrice &&
      <div>
        <svg width={width} height={height} className="animate-blur-in">
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
          <AreaClosed
            data={stock}
            x={d => dateScale(getDate(d))}
            y={d => stockValueScale(getStockValue(d))}
            yScale={stockValueScale}
            strokeWidth={2}
            stroke={stockStrokeColor}
            fill={stockColor}
            opacity={0.5}
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
                cy={tooltipTop}
                r={4}
                fill={tooltipColor}
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
              top={yMax - 36}
              left={_max(0, _min(tooltipLeft - 60, xMax - 150))}
              style={{
                ...defaultStyles,
                textAlign: 'center',
                width: 120}}>
              {formatDate(getDate(tooltipData.selectedPoint))}
            </Tooltip>
            <Tooltip 
              top={tooltipTop - 24} 
              left={_min(tooltipLeft + 12, xMax - 135)} 
              style={{
                ...tooltipStyles,
                width: 120,
                textAlign: 'center'}}>
                  ${getStockValue(tooltipData.selectedPoint).toPrecision(5)}
            </Tooltip>

          </div>
        )}
        {!tooltipData &&
         <Tooltip
            top={5}
            left={5}
            style={{
            ...defaultStyles,
            textAlign: 'center',
            }}>
                <div className="p-1">
                    <span className="font-semibold">Current Price:</span> 
                    ${lastPrice.toPrecision(5)}
                </div>
            </Tooltip>
    }       
      </div>)
  },
)