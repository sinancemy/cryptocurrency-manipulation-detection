import {bisector} from "d3-array"
import {useCallback, useEffect, useMemo} from "react"

// Accessors
export const getDate = (d) => !d ? new Date(0) : new Date(d.time * 1000)
export const getPrice = (d) => !d ? 0 : d.price
export const bisectDate = bisector(d => !d ? new Date(1000) : new Date(d.time * 1000)).left
export const getPostCount = (d) => !d ? 0 : d.sum

export const calculatePoint = (date, points) => {
  if(!date) return null
  const i = bisectDate(points, date)
  return points[i]
}

export const calculatePointIndex = (date, points) => {
  if(!date) return null
  return bisectDate(points, date)
}

export const useSelection = (leftDate, rightDate, startDate, endDate, points) => {

  const dateToPoint = useCallback((date) => {
    if(!date || !points) return null
    return calculatePoint(date, points)
  }, [points])

  const dragLeftPoint = useMemo(() => dateToPoint(leftDate), [leftDate])
  const dragRightPoint = useMemo(() => dateToPoint(rightDate), [rightDate])
  const dragStartPoint = useMemo(() => dateToPoint(startDate), [startDate])
  const dragEndPoint = useMemo(() => dateToPoint(endDate), [endDate])

  const selectedSlice = useMemo(() => {
    if(!points || !leftDate || !rightDate) {
      return null
    }
    const selectedSliceStart = calculatePointIndex(leftDate, points)
    const selectedSliceEnd = calculatePointIndex(rightDate, points)
    return points.slice(selectedSliceStart, selectedSliceEnd)
  }, [leftDate, rightDate, points])
  return { dragStartPoint, dragEndPoint, dragLeftPoint, dragRightPoint, selectedSlice }
}

export const useHover = (hoveredDate, points, onHover = () => {}, onHoverExit = () => {}) => {
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

export const useMouseUpGlobal = (ref, onMouseUp) => {
  useEffect(() => {
    const handleMouseUp = (event) => {
      if (ref.current) {
        onMouseUp(event)
      }
    }
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [ref])
}