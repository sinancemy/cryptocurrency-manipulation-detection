import { useState } from "react"

export const SimpleDropdown = ({ options, selected, setSelected }) => {

  const [focused, setFocused] = useState(false)

  return (
    <div 
      class="relative inline-block text-left" 
      tabIndex="0" 
      onBlur={() => setFocused(false)}
    >
      <div>
          <button 
            type="button" 
            class="inline-flex text-center w-full rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50" 
            onClick={() => setFocused(!focused)}
          >
          {selected}
          </button>
      </div>
      {focused && (
        <div class="origin-top-right absolute right-0 mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="menu-button" tabindex="-1">
          <div class="py-1" role="none">
            {options.filter(opt => opt !== selected).map(opt => (
                <a href="#"
                  onMouseDown={() => setSelected(opt)}
                  class="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900" 
                  role="menuitem" 
                  tabindex="-1" 
                >
                  {opt}
                </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}