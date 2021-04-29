import { useMemo, useState } from "react"
import { getImpactColor, getImpactIcon } from "../Helpers"

const tooltipColor = "gray-900"

export const MiniImpact = ({ impact }) => {

  const [focused, setFocused] = useState(false)
  const avgImpact = useMemo(() => (impact[0] + impact[1] + impact[2] + impact[3])/4, [impact])

  return (
      <div className={`flex flex-row max-w-8 cursor-default relative`} 
          onMouseEnter={() => setFocused(true)}
          onMouseLeave={() => setFocused(false)}>
            { !focused && (
              <div className={`flex flex-row border border-transparent px-1 items-center text-${getImpactColor(avgImpact)}`}>
                <span>{getImpactIcon(avgImpact)}</span>
                <span className="ml-1">{avgImpact.toFixed(1)}</span>
              </div>
            )}
        { focused && (
          <div className={`flex flex-row items-center rounded px-1 bg-${tooltipColor} border border-${getImpactColor(avgImpact)}`}>
            {impact.map(pred => (
                <div className={`flex flex-row items-center text-${getImpactColor(pred)}`}>
                  <span className="ml-1">{getImpactIcon(pred)}</span>
                  <span className="ml-1">{pred.toFixed(1)}</span>
                </div>
                )
            )}
          </div>
        )}
        </div>
    )
}