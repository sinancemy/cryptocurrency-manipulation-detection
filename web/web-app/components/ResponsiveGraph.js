import { useLayoutEffect, useRef, useState } from "react"
import { IoMdSettings } from "react-icons/io"
import { Arrow, useLayer } from "react-laag"
import AutoUpdater from "./AutoUpdater"
import { VerticalSelector } from "./VerticalSelector"
import {GraphContainer} from "./Graph/GraphContainer"

export const ResponsiveGraph = ({ coinType, autoUpdateSetting, onSelectedRange = () => {}}) => {
  const [width, setWidth] = useState(100)
  const [height, setHeight] = useState(100)
  const contentRef = useRef(null)

  const [timeExtent, setTimeExtent] = useState("y")
  // Good starting point: 1573625601
  const [currentTime, setCurrentTime] = useState(parseInt(new Date().getTime()/1000))

  const [selected, setSelected] = useState(false)
  const updateSize = () => {
    const cWidth = contentRef.current.clientWidth
    const cHeight = contentRef.current.clientHeight
    setWidth(cWidth)
    setHeight(cHeight)
  }

  useLayoutEffect(() => {
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [contentRef])

  useLayoutEffect(updateSize, [])

  const {
    triggerProps,
    layerProps,
    arrowProps,
    renderLayer
  } = useLayer({
    isOpen: selected,
    onOutsideClick: () => setSelected(false),
    placement: "left-start",
    triggerOffset: 8,
  });

  return (
      <div className="relative h-full w-full" ref={contentRef}>
          <GraphContainer width={width} height={height} timeExtent={timeExtent}
                          currentTime={currentTime} coinType={coinType}
                          onSelectedRange={onSelectedRange} />
          <div {...triggerProps} className={`absolute right-0 top-0 px-1 ${selected ? "text-gray-400" : "text-white"} bg-gray-900 rounded opacity-70 hover:opacity-100`}>
            <button onClick={() => setSelected(!selected)}>
              <IoMdSettings />
            </button>
          </div>
          {autoUpdateSetting && (
          <div className={`absolute right-2 bottom-2`}>
             <AutoUpdater onTimedUpdate={() => setCurrentTime(parseInt(new Date().getTime()/1000))} />
          </div>
          )}
          { selected && renderLayer(
          <div {...layerProps}
            className="flex flex-col space-y-2 items-center px-2 py-2
                        text-white bg-gray-800 shadow-lg rounded  
                        opacity-90 hover:opacity-100 z-50">
              <span className="text-xs">Time extent</span>
              <VerticalSelector options={["d", "w", "m", "y"]} 
                getter={() => timeExtent}
                setter={setTimeExtent} />
              <Arrow backgroundColor="rgb(33, 41, 54)" {...arrowProps} />
          </div>
          )}
      </div>
  )
}