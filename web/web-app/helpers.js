import {BsArrowDownRight, BsArrowRight, BsArrowUpRight} from "react-icons/bs"
import {FaBitcoin, FaEthereum, FaRedditAlien, FaTwitter} from "react-icons/fa"
import {RiCoinFill} from "react-icons/ri"
import {TiAt} from "react-icons/ti"

export const HOST = ""

const sourceColorMap = [["twitter", "blue-400"], ["reddit", "red-500"]]
const sourceIconMap = [["twitter", <FaTwitter/>], ["reddit", <FaRedditAlien/>]]

const coinColorMap = [["btc", "yellow-700"], ["eth", "purple-500"], ["doge", "yellow-300"]]
const coinIconMap = [["btc", <FaBitcoin/>], ["eth", <FaEthereum/>], ["doge",
  <svg fill="currentColor" width="1em" height="1em" id="Layer_1" version="1.1" viewBox="0 0 226.777 226.777">
    <g id="DOGE_1_">
      <path
        d="M116.338,74.87c-6.069,0-16.236,0-16.236,0v32h25.538v13.399h-25.538v32c0,0,12.65,0,17.023,0   c4.375,0,35.918,0.494,35.87-37.232C152.947,77.313,122.406,74.87,116.338,74.87z"/>
      <path
        d="M113.609,0C50.864,0,0,50.864,0,113.608c0,62.745,50.864,113.609,113.609,113.609c62.743,0,113.607-50.864,113.607-113.609   C227.216,50.864,176.352,0,113.609,0z M118.073,174.968H76.928V120.27H62.425v-13.399h14.502V52.17c0,0,26.958,0,35.312,0   c8.354,0,63.684-1.735,63.684,62.425C175.923,179.816,118.073,174.968,118.073,174.968z"/>
    </g>
  </svg>]]

export const getSourceParts = (source) => {
  if (source == null || !source.includes("@")) return ["*", "*"]
  const [username, src] = source.split("@")
  return [username, src]
}

export const dateToString = (date, withWeekDay) => {
  const parts = ('' + date).split(' ')
  return [withWeekDay ? parts[0] : '',
    parts[2][0] == '0' ? parts[2].slice(1) : parts[2],
    parts[1],
    "'" + parts[3].slice(2),
    parts[4].slice(0, 5)].join(' ')
}

export const getSourceColor = (source) => {
  for (const e of sourceColorMap) {
    if (getSourceParts(source)[1].includes(e[0])) return e[1]
  }
  return "gray-500"
}

export const getSourceIcon = (source) => {
  if (!source.startsWith("*@")) return <TiAt/>
  for (const e of sourceIconMap) {
    if (getSourceParts(source)[1].includes(e[0])) return e[1]
  }
  return () => {
  }
}

export const getCoinColor = (coin) => {
  for (const e of coinColorMap) {
    if (coin.includes(e[0])) return e[1]
  }
  return "gray-300"
}

export const getCoinIcon = (coin) => {
  for (const e of coinIconMap) {
    if (coin.includes(e[0])) return e[1]
  }
  return <RiCoinFill/>
}


const positiveImpactColor = "green-500"
const neutralImpactColor = "yellow-500"
const negativeImpactColor = "red-500"

const positiveImpactIcon = <BsArrowUpRight/>
const negativeImpactIcon = <BsArrowDownRight/>
const neutralImpactIcon = <BsArrowRight/>

const graphPositiveImpactIcon = <BsArrowUpRight/>
const graphNegativeImpactIcon = <BsArrowDownRight/>
const graphNeutralImpactIcon = <BsArrowRight/>

export const getImpactColor = (impact) => (impact > 1) ? positiveImpactColor
  : (impact < -1) ? negativeImpactColor
    : neutralImpactColor

export const getImpactIconGraph = (impact) => (impact > 1) ? graphPositiveImpactIcon
  : (impact < -1) ? graphNegativeImpactIcon
    : graphNeutralImpactIcon

export const getImpactIcon = (impact) => (impact > 1) ? positiveImpactIcon
  : (impact < -1) ? negativeImpactIcon
    : neutralImpactIcon

export const getAvgImpact = (impact) => (impact[0] + impact[1] + impact[2] + impact[3]) / 4