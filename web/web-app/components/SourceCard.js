import { useCallback, useEffect, useState } from "react"
import { getSourceColor, getSourceIcon, getSourceParts } from "../Helpers"


const color = "transparent"
const borderColor = "gray-800"
const selectedColor = "gray-850"
const textColor = "gray-100"

export const SourceCard = ({ 
                            source,
                            checkbox = true,
                            isSelected,
                            onToggle
                          }) => {

  const getShownSrc = useCallback(() => {
    const hasUser = getSourceParts(source)[0] !== "*"
    return hasUser ? source : getSourceParts(source)[1]
  }, [source])

  return (
      <label
        className={`cursor-pointer border border-${borderColor} rounded-r-md flex flex-row text-${textColor} text-sm opacity-${isSelected() ? `100 bg-${selectedColor}` : '60 hover:opacity-100'}`}>
        <div className={`rounded-l-md bg-${getSourceColor(source)} w-1.5`}>
        </div>
        <span className="flex-grow"></span>
        <div className={`px-4 py-2 flex flex-row bg-${color} rounded-r-md w-full`}>
          <div className="">
          { checkbox && (
            <input 
              type="checkbox"
              className="hidden"
              onClick={onToggle}
              checked={isSelected()} />
          ) }
          </div>
          <div className="truncate w-36">
          <span className="hover:underline">
            { getShownSrc() }
            </span>
          </div>
          <span className="flex-grow"></span>
          <div className={`opacity-${isSelected() ? '70' : '40'} text-xl`}>
              { getSourceIcon(source) }
          </div>
          </div>
      </label>
  )
  }