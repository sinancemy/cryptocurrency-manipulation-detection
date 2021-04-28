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
const getPostVolumeValue= (d) => d.volume;
const bisectDate = bisector(d => new Date(d.time * 1000)).left;

const Graph = withTooltip(
  ({
    parentWidth,
    parentHeight,
    margin = { top: 0, right: 0, bottom: 0, left: 0 },
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipTop = [0, 0],
    tooltipLeft = 0,
    graphSettings,
    selectedRange,
    setSelectedRange,
    stock,
    postVolume,
    showPostVolume
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
    const postVolumeScale = useMemo(() => {
      const high = (max(postVolume, getPostVolumeValue) || 0)
      return scaleLinear({
        domain: [0, high + high/8],
        range: [yMax, 0]
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
        // Handle time window.
        const tw0 = x0.valueOf() - (graphSettings.timeWindow/2) * 1000 * 60 * 60 * 24
        const tw1 = x0.valueOf() + (graphSettings.timeWindow/2) * 1000 * 60 * 60 * 24
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
        console.log(postVolumeScale(getPostVolumeValue(vd)))
        showTooltip({
          tooltipData: data,
          tooltipLeft: x,
          tooltipTop: [stockValueScale(getStockValue(d)), postVolumeScale(getPostVolumeValue(vd))],
        });
      },
      [showTooltip, stock, postVolume, stockValueScale, dateScale, graphSettings],
    );

    // Selection handler
    const handleSelect = useCallback((event) => {
      const { x } = localPoint(event) || { x: 0 };
      const x0 = dateScale.invert(x);
      let d = getPricePointWithDate(x0)
      let v = getVolumePointWithDate(x0)
      setSelectedRange({
        mid: d,
        midVolume: v,
        midDate: getDate(d)
      })
    }, [graphSettings])

    const getPricePointWithDate = useCallback((date) => {
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

    const getVolumePointWithDate = useCallback((date) => {
      if(postVolume.length == 1) {
        return postVolume[0]
      }
      const x0 = dateScale(date)
      let mid = bisectDate(postVolume, date)
      // Mid can be 0, especially when the date is out of bounds!
      if(mid == 0) mid += 1
      const d0 = postVolume[mid - 1];
      const d1 = postVolume[mid];
      let d = d0;
      if (d1 && getDate(d1)) {
        d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0;
      }
      return d
    }, [postVolume])

    const getSelectedRange = useCallback((volume = false) => {
        const d = selectedRange.midDate
        const pw0 = d.valueOf() - (graphSettings.timeWindow/2) * 1000 * 60 * 60 * 24
        const pw1 = d.valueOf() + (graphSettings.timeWindow/2) * 1000 * 60 * 60 * 24
        const i0 = bisectDate(volume ? postVolume : stock, pw0)
        const i1 = bisectDate(volume ? postVolume : stock, pw1)  
        return volume ? postVolume.slice(i0, i1) : stock.slice(i0, i1)
    }, [graphSettings, selectedRange])

    const _min = (a, b) => (a < b) ? a : b
    const _max = (a, b) => (a > b) ? a : b

    return  (
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
          {tooltipData && (
          <LinePath
            data={tooltipData.priceTimeWindow}
            x={d => dateScale(getDate(d))}
            y={d => stockValueScale(getStockValue(d))}
            yScale={stockValueScale}
            strokeWidth={2}
            stroke={tooltipReflectionColor}
          />
          )}
          {selectedRange && (
          <LinePath
            data={getSelectedRange()}
            x={d => dateScale(getDate(d))}
            y={d => stockValueScale(getStockValue(d))}
            yScale={stockValueScale}
            strokeWidth={2}
            stroke={selectionColor}
          />
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
            { selectedRange && (
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
          {selectedRange && (
            <g>
              <Line
                from={{ x: dateScale(selectedRange.midDate), y: 0 }}
                to={{ x: dateScale(selectedRange.midDate), y: yMax }}
                stroke={selectionColor}
                strokeWidth={1}
                pointerEvents="none"
                strokeDasharray="5,2"
              />
              <circle
                cx={dateScale(selectedRange.midDate)}
                cy={stockValueScale(getStockValue(getPricePointWithDate(selectedRange.midDate)))}
                r={4}
                fill={selectionColor}
                stroke="white"
                strokeWidth={2}
                pointerEvents="none"
              />
              {showPostVolume && (
                  <circle
                    cx={dateScale(selectedRange.midDate)}
                    cy={postVolumeScale(getPostVolumeValue(getVolumePointWithDate(selectedRange.midDate)))}
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
              left={_max(0, _min(tooltipLeft - 60, xMax - 150))}
              style={{
                ...defaultStyles,
                textAlign: 'center',
                width: 120
              }}
            >
              {formatDate(getDate(tooltipData.selectedPoint))}
            </Tooltip>
            <Tooltip 
              top={(tooltipTop[0] + tooltipTop[1])/2 - 24} 
              left={_min(tooltipLeft + 12, xMax - 135)} 
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
                 Posts(cum): {getPostVolumeValue(tooltipData.selectedVolumePoint)} {" "} 
                </span>
              )}
              </div>
            </Tooltip>

          </div>
        )}
      </div>)
  },
)

export default Graph