
import { useCallback, useEffect, useState } from "react"
import { IoChatbubblesSharp } from "react-icons/io5"
import { FiDollarSign } from "react-icons/fi"
import { getCoinColor, getCoinIcon } from "../Helpers"
import axios from "axios"
import { CuteButton } from "./CuteButton"

const textColor = "gray-200"
const mutedColor = "gray-500"

const color = "gray-900"
const borderColor = "gray-800"
const innerColor = "gray-850"


export const CoinOverview = ({ coin, button }) => {

  const [coinInfo, setCoinInfo] = useState(null)

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/api/coin_info?type=" + coin)
      .then(resp => {
        console.log(resp.data)
        setCoinInfo(resp.data)
      })
  }, [coin])

  return (
    <div className="flex flex-row mb-2">
      <div className={`w-1.5 bg-${getCoinColor(coin)} rounded-l`}></div>
      <div className={`flex flex-row items-center py-2 px-4 w-full text-${textColor} bg-${color} border border-${borderColor} rounded-r`}>
        <div>
        <span className={`text-4xl text-${getCoinColor(coin)}`}>
            {getCoinIcon(coin)}
        </span>
        </div>
        <div className={`flex flex-col ml-2`}>
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
        <span className="flex-grow"></span>
        <div className="w-24">
          { button }
        </div> 
      </div>
    </div>
    )
}