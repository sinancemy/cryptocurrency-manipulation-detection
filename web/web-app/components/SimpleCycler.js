import { useCallback, useMemo, useState } from "react"
import { HiSortDescending, HiSortAscending } from "react-icons/hi"

const borderColor = "gray-900"
const color = "gray-800"
const hoverColor = "gray-700"
const textColor = "gray-200"

export const SimpleCycler = ({ options, selected, setSelected = () => {}}) => {

  const currIndex = useMemo(() => options.findIndex(opt => opt === selected), 
                            [options, selected])
  
  const cycle = useCallback(() => {
    const newIndex = (currIndex + 1) % options.length
    setSelected(options[newIndex])
  }, [currIndex, selected])

  return (options && selected && setSelected &&
      <div>
          <button 
            type="button" 
            className={`flex z-0 items-center px-2 py-1 rounded-md 
                        bg-${color} text-${textColor} hover:bg-${hoverColor}`}
            onClick={cycle}>
            <span>
              { selected === "descending" ? (
              <HiSortDescending />
              ) : selected === "ascending" ? (
                <HiSortAscending />
              ) : null}
            </span>
          <span>{selected}</span>
          </button>
      </div>
  )
}