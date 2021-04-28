import { useCallback, useState } from "react"
import { IoChatbubblesSharp } from "react-icons/io5"
import { FaCode } from "react-icons/fa"
import { dateToString, getSourceColor, getSourceIcon, getSourceParts } from "../Helpers"

const textColor = "gray-200"
const mutedColor = "gray-500"

const color = "gray-900"
const borderColor = "gray-800"
const innerColor = "gray-850"
const innerBorderColor = "gray-800"

export const SourceOverview = ({ source, button }) => {

  return (
    <div className="flex flex-row mb-2">
      <div className={`w-1.5 bg-${getSourceColor(source)} rounded-l`}></div>
      <div className={`flex flex-row items-center py-2 px-4 w-full text-${textColor} bg-${color} border border-${borderColor} rounded-r`}>
        <div>
        <span className={`text-4xl text-${getSourceColor(source)}`}>
            {getSourceIcon(source)}
        </span>
        </div>
        <div className={`flex flex-col ml-2`}>
          <div className={`py-1 flex flex-row items-center text-md text-${mutedColor}`}>
            <span>
            TBD
            </span>
          </div>
          <div className={`flex flex-row items-center text-xs text-${mutedColor}`}>
            <span className="mr-1">
              o
            </span>
            <span className={`text-xs text-${mutedColor} font-mono`}>
              
            </span>
          </div>
        </div>
        <span className="flex-grow"></span>
        <div className="w-24">
          { button }
        </div> 
      </div>
    </div>
    )
}