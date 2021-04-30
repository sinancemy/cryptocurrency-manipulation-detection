
import {getCoinIcon, getImpactColor, getImpactIcon} from "../helpers";
import React from "react";


export const Prediction = ({ prediction, coin }) => {
    return (prediction && coin &&
    <div className="flex flex-col rounded-md">
        <div className="flex flex-row items-center font-semibold text-md mb-2">
            <span>{getCoinIcon(coin)}</span>
            <span className="ml-2">{coin.toUpperCase()}</span>
        </div>
        { prediction.map(p => (
            <div className = {`flex flex-row text-black items-center py-1 px-3 mb-1 rounded border 
                                border-${getImpactColor(p)}  bg-${getImpactColor(p)}`}>
                <div className="font-mono text-sm"> {p.toPrecision(4)} </div>
                <span className="flex-grow"></span>
                <div className={`text-xl`}>{getImpactIcon(p)}</div>
            </div>
        )) }
    </div>
  );
}