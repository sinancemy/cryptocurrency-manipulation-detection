import { useState } from "react"
import { HiSortDescending, HiSortAscending } from "react-icons/hi"

const borderColor = "gray-900"
const color = "gray-800"
const hoverColor = "gray-700"
const textColor = "gray-200"

export const SimpleDropdown = ({ options, selected, setSelected }) => {

  const [focused, setFocused] = useState(false)

  return (options && selected && setSelected &&
    <div 
      class="relative inline-block text-left text-xs" 
      tabIndex="0" 
      onBlur={() => setFocused(false)}>
      <div>
          <button 
            type="button" 
            className={`flex focus:ring-white focus:ring-1 items-center border-2 border-${borderColor} px-2 py-1 rounded-md bg-${color} text-${textColor} hover:bg-${hoverColor}`}
            onClick={() => setFocused(!focused)}>
            { selected === "descending" ? (
              <HiSortDescending />
            ) : selected === "ascending" ? (
              <HiSortAscending />
            ) : null}
          <span>{selected}</span>
          </button>
      </div>
      {focused && (
        <div 
          className={`origin-top-right w-24 absolute bg-${color} text-${textColor} overflow-hidden right-0 mt-2 rounded shadow-lg border`} 
          role="menu" 
          aria-orientation="vertical" 
          aria-labelledby="menu-button" 
          tabindex="-1">
          <div role="none">
            {options.filter(opt => opt !== selected).map(opt => (
                <a href="#"
                  onMouseDown={() => setSelected(opt)}
                  className={`block px-3 py-2 hover:bg-${hoverColor}`}
                  role="menuitem" 
                  tabindex="-1">
                  {opt}
                </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}