import React from "react"

export const FixedTooltip = ({ x, y, children}) => {

  return (
    <g transform={`translate(${x}, ${y})`}>
        { children }
    </g>
  )
}