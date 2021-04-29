
import { BsArrowUpRight, BsArrowDownRight, BsArrowRight } from "react-icons/bs"
import {getCoinIcon} from "../Helpers";
import {MultipurposeCard} from "./MultipurposeCard";
import {RiCoinFill} from "react-icons/ri";
import React from "react";

const positiveColor = "green-500"
const neutralColor = "yellow-500"
const negativeColor = "red-500"

const borderColor = "gray-900"
const fullWidth = false

export const Prediction = ({ prediction, coin }) => {
    let colors = []
    let arrows = []
    for (const p of prediction){
        if (p < -1) {
            colors.push(negativeColor)
            arrows.push(<BsArrowDownRight/>)
        }
        else if (p > 1) {
            colors.push(positiveColor)
            arrows.push(<BsArrowUpRight/>)
        }
        else {
            colors.push(neutralColor)
            arrows.push(<BsArrowRight/>)
        }
    }
    return (
    <div className="flex flex-col rounded-md">
        <div className="flex flex-row items-center font-semibold text-md mb-2">
            <span>{getCoinIcon(coin)}</span>
            <span className="ml-2">{coin.toUpperCase()}</span>
        </div>
        { prediction.map(p => (
            <div className = {`flex flex-row text-black items-center py-1 px-3 mb-1 border border-${colors[0]} rounded bg-${colors[0]}`}>
                <div className="font-mono text-sm"> {prediction[0].toPrecision(4)} </div>
                <span className="flex-grow"></span>
                <div className={`text-xl`}>{arrows[0]}</div>
            </div>
        )) }
    </div>
  );
}