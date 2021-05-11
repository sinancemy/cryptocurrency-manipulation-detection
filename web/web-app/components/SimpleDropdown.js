import { useState } from "react"
import { HiSortDescending, HiSortAscending } from "react-icons/hi"
import { Arrow, useLayer } from "react-laag"

const borderColor = "gray-900"
const color = "gray-800"
const hoverColor = "gray-700"
const textColor = "gray-200"

export const SimpleDropdown = ({ options, selected, setSelected }) => {

  const [focused, setFocused] = useState(false)

  const {
    triggerProps,
    layerProps,
    arrowProps,
    renderLayer
  } = useLayer({
    isOpen: focused,
    onOutsideClick: () => setFocused(false),
    placement: "bottom-center",
    triggerOffset: 8,
  })

  return (options && selected && setSelected &&
    <div className="relative inline-block text-left text-xs">
      <div>
          <button {...triggerProps}
            type="button" 
            className={`flex items-center px-2 py-1 rounded-md bg-${color} text-${textColor} hover:bg-${hoverColor}`}
            onClick={() => setFocused(!focused)}>
          <span>{selected}</span>
          </button>
      </div>
      {focused && renderLayer(
        <div {...layerProps} className="z-50">
          <div className={`flex flex-col w-24 shadow-lg text-xs text-${textColor} rounded-lg overflow-hidden`}>
            {options.filter(opt => opt !== selected).map((opt) => (
                <button
                  onClick={() => { setFocused(false); setSelected(opt) }}
                  className={`px-3 py-2 bg-${color} hover:bg-${hoverColor}`}>
                  {opt}
                </button>
            ))}
          </div>
          <Arrow backgroundColor={`rgb(33,41,54)`} {...arrowProps} />
        </div>
      )}
    </div>
  )
}