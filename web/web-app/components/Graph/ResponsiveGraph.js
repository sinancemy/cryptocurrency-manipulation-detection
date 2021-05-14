import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react"
import { IoMdSettings } from "react-icons/io"
import { Arrow, useLayer } from "react-laag"
import AutoUpdater from "./AutoUpdater"
import { VerticalSelector } from "../VerticalSelector"
import {GraphContainer} from "./GraphContainer"
import {useApiData} from "../../api-hook"

export const ResponsiveGraph = ({ coinType, autoUpdateSetting, onSelectedRange = () => {}}) => {

  const [currentTime, setCurrentTime] = useState(parseInt(new Date().getTime()/1000))
  const {result: apiInfo} = useApiData(null, "info", [], [currentTime])
  const [timeExtent, setTimeExtent] = useState(null)
  const [sma, setSma] = useState(null)
  const availableExtents = useMemo(() => apiInfo ?
    Object.keys(apiInfo.available_settings.extents).sort((a, b) =>
      apiInfo.available_settings.extents[a] - apiInfo.available_settings.extents[b]) : null, [apiInfo])
  const availableSmas = useMemo(() => apiInfo ?
    Object.keys(apiInfo.available_settings.smas).sort((a, b) =>
      apiInfo.available_settings.smas[a] - apiInfo.available_settings.smas[b]) : null, [apiInfo])
  // Set default time extent.
  useEffect(() => {
    if(!timeExtent && apiInfo) setTimeExtent(apiInfo.available_settings.default_extent)
  }, [apiInfo, sma, timeExtent])
  // Set default SMA.
  useEffect(() => {
    if(!apiInfo || !timeExtent) return
    if(!sma) setSma(apiInfo.available_settings.default_sma[timeExtent])
  }, [timeExtent, sma, apiInfo])
  const setTimeExtentWithDefaultSMA = useCallback((newExtent) => {
    setTimeExtent(newExtent)
    if(apiInfo) setSma(apiInfo.available_settings.default_sma[newExtent])
  }, [apiInfo])
  // Handle responsiveness.
  const [width, setWidth] = useState(100)
  const [height, setHeight] = useState(100)
  const contentRef = useRef(null)

  const updateSize = () => {
    if(!contentRef.current) return
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

  // Handle settings tooltip.
  const [selected, setSelected] = useState(false)
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
  })

  return (
      <div className="relative h-full w-full" ref={contentRef}>
          <GraphContainer width={width} height={height} timeExtent={timeExtent} sma={sma}
                          currentTime={currentTime} coinType={coinType}
                          onSelectedRange={onSelectedRange} apiInfo={apiInfo} />
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
            className="flex flex-col space-y-2 py-1 px-2 w-32
                        text-white bg-gray-800 shadow-lg rounded  
                        opacity-90 hover:opacity-100 z-50">
            <div>
              <span className="text-xs font-semibold">
                Time extent
              </span>
              <VerticalSelector options={availableExtents}
                getter={() => timeExtent}
                setter={setTimeExtentWithDefaultSMA} />
            </div>
            <div>
              <span className="text-xs font-semibold">
                Post window
              </span>
              <VerticalSelector options={availableSmas}
                  getter={() => sma}
                  setter={setSma} />
            </div>
            <Arrow backgroundColor="rgb(33, 41, 54)" {...arrowProps} />
          </div>
          )}
      </div>
  )
}