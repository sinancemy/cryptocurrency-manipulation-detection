import { useCallback, useEffect, useState } from "react"
import { FaRedditAlien, FaTwitter } from "react-icons/fa"
import { getSourceColor, getSourceIcon, getSourceParts } from "../Helpers"


const colorMap =  [["twitter", "blue-400"], ["reddit", "red-500"]]
const iconMap = [["twitter", <FaTwitter />], ["reddit", <FaRedditAlien />]]
const color = "gray-800"
const hoverColor = "gray-780"
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
        className={`cursor-pointer flex flex-row text-${textColor} text-sm opacity-${isSelected() ? '100' : '40 hover:opacity-70'}`}>
        <div className={`rounded-l bg-${getSourceColor(source)} w-1.5`}>
        </div>
        <span className="flex-grow"></span>
        <div className={`px-4 py-2 flex flex-row bg-${color} rounded-r w-full`}>
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
            { getShownSrc() }
          </div>
          <span className="flex-grow"></span>
          <div className={`opacity-40 text-xl`}>
              { getSourceIcon(source) }
          </div>
          </div>
      </label>
  )
  }