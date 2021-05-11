import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { getCoinColor, getCoinIcon, getSourceParts } from "../helpers"
import { MultipurposeCard } from "./MultipurposeCard"


const color = "transparent"
const selectedColor = "gray-850"
const textColor = "gray-100"

export const CoinCard = ({ coin, isSelected = () => true, onToggle = () => {} }) => {

  return (coin && isSelected && onToggle &&
    <div className={`opacity-${isSelected() ? '100 ' : '60 hover:opacity-100'}`}>
      <label className={`cursor-pointer text-${textColor} text-sm`}>
      <MultipurposeCard badgeColor={getCoinColor(coin)} colorizer={() => isSelected() ? selectedColor : color}>
        <MultipurposeCard.Left>
        </MultipurposeCard.Left>
        <MultipurposeCard.Middle>
          <div className="pl-3 py-2">
            <input 
              type="radio"
              className="hidden"
              name="coin-type"
              onChange={onToggle}
              checked={isSelected()} />
            <Link href={`/coin-info?coin=` + coin}>
              <span className="hover:underline">
                { coin.toUpperCase() }
              </span>
            </Link>
          </div>
        </MultipurposeCard.Middle>
        <MultipurposeCard.Right>
          <div className={`opacity-${isSelected() ? '70' : '40'} text-xl pr-2 py-2`}>
              { getCoinIcon(coin) }
          </div>
        </MultipurposeCard.Right>
      </MultipurposeCard>
      </label>
    </div>
  )
  }