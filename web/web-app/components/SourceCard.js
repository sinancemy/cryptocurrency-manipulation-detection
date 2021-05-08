import { useCallback, useEffect, useState } from "react"
import { getSourceColor, getSourceIcon, getSourceParts } from "../helpers"
import Link from "next/link"
import { MultipurposeCard } from "./MultipurposeCard"
import { TiAt } from "react-icons/ti"

const color = "transparent"
const selectedColor = "gray-850"
const textColor = "gray-100"

export const SourceCard = ({ source, isSelected = () => true, onToggle = () => {} }) => {

  const isUser = useCallback(() => getSourceParts(source)[0] !== "*", [source])

  return (
    <div className={`opacity-${isSelected() ? '100 ' : '60 hover:opacity-100'}`}>
      <label className={`cursor-pointer text-${textColor} text-sm`}>
        <MultipurposeCard badgeColor={getSourceColor(source)} colorizer={() => isSelected() ? selectedColor : color}>
          <MultipurposeCard.Left>
          </MultipurposeCard.Left>
          <MultipurposeCard.Middle>
            <div className="pl-3 py-2">
              <input 
                type="checkbox"
                className="hidden"
                onClick={onToggle}
                defaultChecked={isSelected()} />
                { isUser() ? (
                <span className="hover:underline">
                  <Link href={`/user-info?user=` + source}>
                    {getSourceParts(source)[0]}
                  </Link>
                </span>
                ) : (
                <span className="hover:underline">
                  <Link href={`/source-info?source=` + source}>
                    {getSourceParts(source)[1]}
                  </Link>
                </span>
                )}
              </div>
          </MultipurposeCard.Middle>
          <MultipurposeCard.Right>
            <div className={`opacity-${isSelected() ? '70' : '40'} text-xl p-2`}>
                { isUser() ?  <TiAt /> : getSourceIcon(source) }
            </div>
          </MultipurposeCard.Right>
        </MultipurposeCard>
      </label>
    </div>
    )
  }