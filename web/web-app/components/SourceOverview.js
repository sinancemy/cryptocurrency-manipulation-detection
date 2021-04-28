import { useCallback, useState } from "react"
import { IoChatbubblesSharp } from "react-icons/io5"
import { FaCode } from "react-icons/fa"
import { dateToString, getSourceColor, getSourceIcon, getSourceParts } from "../Helpers"
import { MultipurposeCard } from "./MultipurposeCard"
import { TiAt } from "react-icons/ti"

const mutedColor = "gray-500"

export const SourceOverview = ({ source, button }) => {

  const hasUsername = () => !source.startsWith('*@')
  const getUsername = () => getSourceParts(source)[0] === '*' ? null : getSourceParts(source)[0]
  const getSource = () => getSourceParts(source)[1]

  return (
    <MultipurposeCard badgeColor={getSourceColor(source)}>
      <MultipurposeCard.Left>
        <span className={`text-4xl text-${getSourceColor(source)}`}>
          { hasUsername() ? (
            <TiAt />
          ) : getSourceIcon(source)}
        </span>
      </MultipurposeCard.Left>
      <MultipurposeCard.Middle>
        <div className={`flex flex-col`}>
          <div className={`py-1 flex flex-row items-center text-base text-${mutedColor}`}>
              { hasUsername() ? (
                <span>
                 {getUsername()}
                </span>
              ) : (
                <span className={`text-base`}>
                 {getSource()}
                </span>
              ) }
          </div>
          { hasUsername() && (
            <div className={`flex flex-row items-center text-xs text-${mutedColor}`}>
                <span>
                  { getSourceIcon(source) }
                </span>
                <span className="ml-1">
                  {getSource()}
                </span>
            </div>
          )}
        </div>
      </MultipurposeCard.Middle>
      <MultipurposeCard.Right>
        <div className="w-24">
          { button }
        </div> 
      </MultipurposeCard.Right>
    </MultipurposeCard>
    )
}