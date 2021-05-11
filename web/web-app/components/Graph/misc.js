import {bisector} from "d3-array"
import {useCallback, useEffect, useMemo, useState} from "react"

export const timeExtentSeconds = {
  "d": 60 * 60 * 24,
  "w": 60 * 60 * 24 * 7,
  "m": 60 * 60 * 24 * 30,
  "y": 60 * 60 * 24 * 365
}

// Accessors
export const getDate = (d) => !d ? new Date(0) : new Date(d.time * 1000)
export const getPrice = (d) => !d ? 0 : d.price
export const bisectDate = bisector(d => !d ? new Date(1000) : new Date(d.time * 1000)).left

export const invertScale = (x, scale) => {
  if(!x) return null
  return scale.invert(x)
}

export const calculatePoint = (date, points) => {
  if(!date) return null
  const i = bisectDate(points, date)
  return points[i]
}

export const calculatePointIndex = (date, points) => {
  if(!date) return null
  return bisectDate(points, date)
}

export const calculateSlice = (date, points, selectionWindow, timeExtent) => {
  if(!date) return null
  const normalizedSelectionWindow = selectionWindow * (timeExtentSeconds[timeExtent]/(60 * 60 * 24 * 5))
  const startDate = date.valueOf() - (normalizedSelectionWindow/2) * 1000 * 60 * 60
  const endDate = date.valueOf() + (normalizedSelectionWindow/2) * 1000 * 60 * 60
  const i0 = bisectDate(points, startDate)
  const i1 = bisectDate(points, endDate)
  return points.slice(i0, i1)
}

export const useSelection = (startDate, endDate, points) => {
  const dragStartPoint = useMemo(() => {
    if(!startDate || !points) return null
    return calculatePoint(startDate, points)
  }, [startDate, points])

  const dragEndPoint = useMemo(() => {
    if(!endDate || !points) return null
    return calculatePoint(endDate, points)
  }, [endDate, points])

  const selectedSlice = useMemo(() => {
    if(!points || !startDate || !endDate) {
      return null
    }
    const selectedSliceStart = calculatePointIndex(startDate, points)
    const selectedSliceEnd = calculatePointIndex(endDate, points)
    return points.slice(selectedSliceStart, selectedSliceEnd)
  }, [startDate, endDate, points])
  return { dragStartPoint, dragEndPoint, selectedSlice }
}

export const useHover = (hoveredDate, points, selectionWindow, timeExtent,
                         onHover = () => {}, onHoverExit = () => {}) => {
  const hoveredPoint = useMemo(() => calculatePoint(hoveredDate, points),
    [points, hoveredDate])
  useEffect(() => {
    if(!hoveredPoint) {
      onHoverExit()
      return
    }
    onHover({ hoveredPoint })
  }, [hoveredPoint])
  return { hoveredPoint }
}