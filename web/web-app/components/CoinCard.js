import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { getCoinColor, getCoinIcon, getSourceParts } from "../helpers"
import { MultipurposeCard } from "./MultipurposeCard"


const color = "transparent"
const selectedColor = "gray-850"
const textColor = "gray-100"

export const CoinCard = ({ coin, isSelected, onToggle }) => {

  return (coin && isSelected && onToggle &&
    <div className={`opacity-${isSelected() ? '100 ' : '60 hover:opacity-100'}`}>
      <label
        className={`cursor-pointer text-${textColor} text-sm`}>
      <MultipurposeCard badgeColor={getCoinColor(coin)} colorizer={() => isSelected() ? selectedColor : color}>
        <MultipurposeCard.Left>
          <input 
            type="radio"
            className="hidden"
            name="coin-type"
            onClick={onToggle}
            checked={isSelected()} />
            <Link href={`/coin-info?coin=` + coin}>
              <span className="hover:underline">
                { coin.toUpperCase() }
              </span>
            </Link>
        </MultipurposeCard.Left>
        <MultipurposeCard.Right>
          <div className={`opacity-${isSelected() ? '70' : '40'} text-xl`}>
              { getCoinIcon(coin) }
          </div>
        </MultipurposeCard.Right>
      </MultipurposeCard>
      </label>
    </div>
  )
  }