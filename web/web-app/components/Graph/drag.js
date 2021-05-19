import {useCallback, useEffect, useMemo, useState} from "react"
import {localPoint} from "@vx/event"

export const useDrag = (width) => {
  const [startX, setStartX] = useState(null)
  const [endX, setEndX] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const leftX = useMemo(() => {
    if(!endX) return startX
    return Math.min(startX, endX)
  }, [startX, endX])

  const rightX = useMemo(() => {
    if(!endX) return startX
    return Math.max(startX, endX)
  }, [startX, endX])

  const onMouseUpDrag = useCallback(() => {
    setIsDragging(false)
  }, [leftX, rightX])

  const onMouseDownDrag = useCallback((event) => {
    // Restart dragging.
    const { x } = localPoint(event) || { x: 0 }
    setStartX(x/width)
    setEndX(null)
    setIsDragging(true)
  }, [width])

  const onMouseMoveDrag = useCallback((event) => {
    if(!isDragging) return
    const { x } = localPoint(event) || { x: 0 }
    setEndX(x/width)
  }, [startX, width, isDragging])

  // Reset the drag when isDragging is flipped off.
  useEffect(() => {
    if(isDragging || !leftX || !rightX) return
    if(leftX.valueOf() === rightX.valueOf()) {
      setStartX(null)
      setEndX(null)
    }
  }, [isDragging])

  return { isDragging, onMouseDownDrag, onMouseMoveDrag, onMouseUpDrag, startX, endX, leftX, rightX }
}