
import { BsArrowUpRight, BsArrowDownRight, BsArrowRight } from "react-icons/bs"
import {getCoinIcon} from "../Helpers";
import {MultipurposeCard} from "./MultipurposeCard";
import {RiCoinFill} from "react-icons/ri";
import React from "react";

const positiveColor = "green-500 "
const neutralColor = "yellow-500"
const negativeColor = "red-400"

const borderColor = "gray-900"
const fullWidth = false

export const Prediction = ({ prediction }) => {
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
    <>
        <div className = {`flex flex-row items-center py-1 px-3 border border-${colors[0]} rounded bg-${colors[0]}`}
                style={{marginBottom: '.25rem'}}>
            <div> {prediction[0].toPrecision(4)} </div>
            <span className="flex-grow"></span>
            <div className={`text-xl`}>{arrows[0]}</div>
        </div>
        <div className = {`flex flex-row items-center py-1 px-3 border border-${colors[1]} rounded bg-${colors[1]}`}
                style={{marginBottom: '.25rem'}}>
            <div> {prediction[1].toPrecision(4)} </div>
            <span className="flex-grow"></span>
            <div className={`text-xl`}>{arrows[1]}</div>
        </div>
        <div className = {`flex flex-row items-center py-1 px-3 border border-${colors[2]} rounded bg-${colors[2]}`}
                style={{marginBottom: '.25rem'}}>
            <div> {prediction[2].toPrecision(4)} </div>
            <span className="flex-grow"></span>
            <div className={`text-xl`}>{arrows[2]}</div>
        </div>
        <div className = {`flex flex-row items-center py-1 px-3 border border-${colors[3]} rounded bg-${colors[3]}`}
                style={{marginBottom: '.25rem'}}>
            <div> {prediction[3].toPrecision(4)} </div>
            <span className="flex-grow"></span>
            <div className={`text-xl`}>{arrows[3]}</div>
        </div>
    </>
  );
}