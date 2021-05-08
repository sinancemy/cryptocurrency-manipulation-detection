import { useMemo } from "react"
import { Arrow, useHover, useLayer } from "react-laag"
import { getImpactColor, getImpactIcon } from "../helpers"

const tooltipColor = "gray-900"

export const MiniImpact = ({ avgImpact, impact }) => {

  const isCalculated = useMemo(() => !isNaN(avgImpact), [avgImpact])
  const [isOver, hoverProps] = useHover()

  const {
    triggerProps,
    layerProps,
    renderLayer
  } = useLayer({
    isOpen: isOver,
    overflowContainer: false,
    placement: "bottom-end",
    auto: true,
    possiblePlacements: ["top-end"],
    triggerOffset: 0,
  });

  return (
      <div className={`flex flex-row max-w-8 cursor-default`}>
        <div {...triggerProps} {...hoverProps}
          className={`flex flex-row border border-transparent items-center text-${getImpactColor(avgImpact)}`}>
          <span className="mr-1">{!isCalculated ? "?" : avgImpact.toFixed(1)}</span>
          <span>{isCalculated && getImpactIcon(avgImpact)}</span>
        </div>
        { isOver && isCalculated && renderLayer(
          <div className="tooltip" {...layerProps}>
            <div className={`text-xs flex flex-row space-x-2 py-1 px-2 items-center rounded shadow-lg
                            bg-${tooltipColor} border border-${getImpactColor(avgImpact)}`}>
              {impact.map(pred => (
                  <div className={`flex flex-row space-x-1 items-center text-${getImpactColor(pred)}`}>
                    <span>{pred.toFixed(1)}</span>
                    <span>{getImpactIcon(pred)}</span>
                  </div>
                  )
              )}
            </div>
          </div>
        )}
        </div>
    )
}