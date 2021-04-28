
import { useCallback, useEffect, useState } from "react"
import { IoChatbubblesSharp } from "react-icons/io5"
import { FiDollarSign } from "react-icons/fi"
import { getCoinColor, getCoinIcon } from "../Helpers"
import axios from "axios"
import { CuteButton } from "./CuteButton"
import { MultipurposeCard } from "./MultipurposeCard"

const mutedColor = "gray-500"

export const CoinOverview = ({ coin, button }) => {

  const [coinInfo, setCoinInfo] = useState(null)

  // TODO parametrize!
  useEffect(() => {
    axios.get("http://127.0.0.1:5000/api/coin_info?type=" + coin)
      .then(resp => {
        console.log(resp.data)
        setCoinInfo(resp.data)
      })
  }, [coin])

  return (
    <MultipurposeCard badgeColor={getCoinColor(coin)}>
      <MultipurposeCard.Left>
        <span className={`text-4xl text-${getCoinColor(coin)}`}>
          {getCoinIcon(coin)}
        </span>
      </MultipurposeCard.Left>
      <MultipurposeCard.Middle>
        <div className={`flex flex-col`}>
          <div className={`py-1 flex flex-row items-center text-md text-${mutedColor}`}>
            <span>
              {coin.toUpperCase()}
            </span>
          </div>
          <div className={`flex flex-row items-center text-xs text-${mutedColor}`}>
            <span className="mr-1">
              <FiDollarSign />
            </span>
            <span className={`text-xs text-${mutedColor} font-mono`}>
              { (coinInfo && coinInfo.last_price) ? (
                coinInfo.last_price.price.toPrecision(5)
              ) : ("-")}
            </span>
          </div>
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
