
import { useCallback, useEffect, useState } from "react"
import { IoChatbubblesSharp } from "react-icons/io5"
import { FiDollarSign } from "react-icons/fi"
import { getCoinColor, getCoinIcon } from "../helpers"
import axios from "axios"
import { CuteButton } from "./CuteButton"
import { MultipurposeCard } from "./MultipurposeCard"
import Link from "next/link"

const mutedTextColor = "gray-500"
const bgColor = "gray-850"

export const CoinOverview = ({ coin, button, singleLine = false }) => {

  return (coin &&
    <MultipurposeCard badgeColor={getCoinColor(coin)} colorizer={() => bgColor}>
      <MultipurposeCard.Left>
        <div className={`text-4xl text-${getCoinColor(coin)} p-4`}>
          {getCoinIcon(coin)}
        </div>
      </MultipurposeCard.Left>
      <MultipurposeCard.Middle>
        <div className={`flex flex-col`}>
          <div className={`flex flex-row items-center`}>
            <span className="hover:underline">
              <Link href={`/coin-info?coin=${coin}`}>
                {coin.toUpperCase()}
              </Link>
            </span>
          </div>
          { !singleLine && (
            <div className={`flex flex-row items-center text-xs text-${mutedTextColor}`}>
              <span className="mr-1">
                <FiDollarSign />
              </span>
              <span className={`text-xs text-${mutedTextColor} font-mono`}>
                0.00
              </span>
            </div>
          )}
        </div>
      </MultipurposeCard.Middle>
      <MultipurposeCard.Right>
        <div className="px-3">
          { button }
        </div>
      </MultipurposeCard.Right>
    </MultipurposeCard>
    )
}
