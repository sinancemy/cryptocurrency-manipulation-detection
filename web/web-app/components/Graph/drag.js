import {useCallback, useMemo, useState} from "react"
import {localPoint} from "@vx/event"

export const useDrag = (width, onDragComplete = () => {}) => {
  const [start, setStart] = useState(null)
  const [end, setEnd] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const minX = useMemo(() => {
    if(!end) return start
    return Math.min(start, end)
  }, [start, end])

  const maxX = useMemo(() => {
    if(!end) return start
    return Math.max(start, end)
  }, [start, end])

  const onMouseUpDrag = useCallback(() => {
    setIsDragging(false)
    if(minX.valueOf() === maxX) {
      setStart(null)
      setEnd(null)
      return
    }
    onDragComplete(minX, maxX)
  }, [minX, maxX])

  const onMouseDownDrag = useCallback((event) => {
    // Restart dragging.
    const { x } = localPoint(event) || { x: 0 }
    setStart(x/width)
    setEnd(null)
    setIsDragging(true)
  }, [width])

  const onMouseMoveDrag = useCallback((event) => {
    if(!isDragging) return
    const { x } = localPoint(event) || { x: 0 }
    if(x === start) {
      setEnd(null)
      return
    }
    setEnd(x/width)
  }, [start, width, isDragging])

  return { isDragging, onMouseDownDrag, onMouseMoveDrag, onMouseUpDrag, minX, maxX }
}