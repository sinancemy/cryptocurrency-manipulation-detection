import { useCallback, useEffect, useState } from "react"
import { getSourceColor, getSourceIcon, getSourceParts } from "../Helpers"
import Link from "next/link"
import { MultipurposeCard } from "./MultipurposeCard"
import { TiAt } from "react-icons/ti"

const color = "transparent"
const selectedColor = "gray-850"
const textColor = "gray-100"

export const SourceCard = ({ source, isSelected, onToggle }) => {

  const isUser = useCallback(() => getSourceParts(source)[0] !== "*", [source])

  return (
    <div className={`opacity-${isSelected() ? '100 ' : '60 hover:opacity-100'}`}>
      <label
        className={`cursor-pointer text-${textColor} text-sm`}>
        <MultipurposeCard badgeColor={getSourceColor(source)} colorizer={() => isSelected() ? selectedColor : color}>
          <MultipurposeCard.Left>
            <input 
              type="checkbox"
              className="hidden"
              onClick={onToggle}
              checked={isSelected()} />
                  { isUser() ? (
                    <div className="flex flex-row justify-between items-center">
                        <span className="hover:underline">
                          <Link href={`/source-info?source=` + source}>
                           {getSourceParts(source)[0]}
                          </Link>
                        </span>
                        <span className="ml-2 text-xs opacity-30">{getSourceIcon(source)}</span>
                        <span className="ml-1 text-xs opacity-30">{getSourceParts(source)[1]}</span>
                      </div>
                  ) : (
                    <span className="hover:underline">
                      <Link href={`/source-info?source=` + source}>
                        {getSourceParts(source)[1]}
                      </Link>
                    </span>
     )}
          </MultipurposeCard.Left>
          <MultipurposeCard.Right>
            <div className={`opacity-${isSelected() ? '70' : '40'} text-xl`}>
                { isUser() ?  <TiAt /> : getSourceIcon(source) }
            </div>
          </MultipurposeCard.Right>
        </MultipurposeCard>
      </label>
    </div>
    )
  }