import { useMemo } from "react"

const borderColor = "gray-900"
const color = "transparent"
const textColor = "gray-200"
const selectedColor = "gray-700"
const selectedTextColor = "gray-200"

export const VerticalSelector = ({ prefix = null, suffix = null, options, getter, setter }) => {

  return (options && getter && setter &&
      <div className={`flex flex-row flex-wrap items-center text-${textColor} text-xs`}>
        {prefix && 
        <div className="px-2 py-1 cursor-default" disabled={true}>
          {prefix}
        </div>
        }
        {options.map((opt, i) => (
          <button
            className={`${getter() === opt ? (`bg-${selectedColor} text-${selectedTextColor}`) : (`bg-${color} opacity-50 hover:opacity-80 text-${textColor}`)}
                       px-1 rounded`}
            onClick={e => setter(opt)}>
          {opt}
        </button>
        ))}
        {suffix &&
        <div className="px-2 py-1 cursor-default" disabled={true}>
          {suffix}
        </div>
        }
      </div>
  )
}