import { useCallback, useEffect, useState } from "react"
import { getCoinColor, getCoinIcon, getSourceParts } from "../Helpers"
import Link from "next/link"

const color = "transparent"
const borderColor = "gray-800"
const selectedColor = "gray-850"
const textColor = "gray-100"

export const CoinCard = ({ 
                            coin,
                            radio = true,
                            radioName = "coin-type",
                            isSelected,
                            onToggle
                          }) => {

  return (
      <label
        className={`cursor-pointer flex flex-row text-${textColor} text-sm opacity-${isSelected() ? `100` : '60 hover:opacity-100'}`}>
        <div className={`rounded-l-md bg-${getCoinColor(coin)} w-1.5`}>
        </div>
        <span className="flex-grow"></span>
        <div className={`px-4 py-2 flex flex-row ${isSelected() ? `bg-${selectedColor}` : `bg-${color}`} w-full border border-${borderColor} rounded-r-md`}>
          <div className="">
          { radio && (
            <input 
              type="radio"
              className="hidden"
              name={radioName}
              onClick={onToggle}
              checked={isSelected()} />
          ) }
          </div>
          <div className="truncate w-36">
          <Link href={"/coin-info?coin=" + coin}>
          <span className="hover:underline">
            { coin.toUpperCase() }
            </span>
            </Link>
          </div>
          <span className="flex-grow"></span>
          <div className={`opacity-${isSelected() ? '70' : '40'} text-xl`}>
              { getCoinIcon(coin) }
          </div>
          </div>
      </label>
  )
  }