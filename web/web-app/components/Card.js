import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { getCoinColor, getCoinIcon, getSourceParts } from "../Helpers"


const Title = () => null
const Input = () => null

const color = "transparent"
const borderColor = "gray-800"
const selectedColor = "gray-850"
const textColor = "gray-100"

export const Card = ({ children, isSelected, badgeColor, icon}) => {

  const title = children.find(c => c.type === Title)
  const input = children.find(c => c.type === Input)

  return (
      <label
        className={`cursor-pointer flex flex-row text-${textColor} text-sm opacity-${isSelected() ? `100` : '60 hover:opacity-100'}`}>
        <div className={`rounded-l-md bg-${badgeColor} w-1.5`}>
        </div>
        <span className="flex-grow"></span>
        <div className={`px-4 py-2 flex flex-row items-center ${isSelected() ? `bg-${selectedColor}` : `bg-${color}`} w-full border border-${borderColor} rounded-r-md`}>
          <div className="">
            { input && input.props.children }
          </div>
          <div className="truncate w-36">
            { title && title.props.children }
          </div>
          <span className="flex-grow"></span>
          <div className={`opacity-${isSelected() ? '70' : '40'} text-xl`}>
            { icon }
          </div>
          </div>
      </label>
    )
  }

  Card.Title = Title
  Card.Input = Input