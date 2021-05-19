import {Tooltip, TooltipWithBounds} from "@vx/tooltip"
import {useMemo} from "react"
import {getPostCount, getPrice} from "./misc"
import {dateToString} from "../../helpers"

export const GraphTooltip =  ({ xMax, yMax, date, xscale, priceScale, postScale, pricePoint, postPoint }) => {

  const left = useMemo(() => (xscale && date) ? xscale(date) : null, [date, xscale])

  return (date && left &&
      <>
        <Tooltip width={120}
          left={Math.max(Math.min(xMax-130, left), 120)}
          top={5}>
          <div className={"text-xs"}>
            { dateToString(date) }
          </div>
        </Tooltip>
        <Tooltip left={5} top={5}>
          <div className={"flex flex-col text-xs"}>
            <div className={"flex flex-row justify-between space-x-2"}>
              <div className={"font-semibold"}>
                Price:
              </div>
              <div>
                { pricePoint && getPrice(pricePoint).toPrecision(5) }$
              </div>
            </div>
            <div className={"flex flex-row justify-between space-x-2"}>
              <div className={"font-semibold"}>
                Posts:
              </div>
              <div>
                { postPoint && getPostCount(postPoint).toFixed(3) }
              </div>
            </div>
          </div>
        </Tooltip>
      </>
  )
}