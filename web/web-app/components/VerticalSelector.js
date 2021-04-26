import { useMemo } from "react"

export const VerticalSelector = ({ prefix = null, suffix = null, options, getter, setter }) => {

  return useMemo(() =>
    <div className="flex flex-row">
      {prefix && <div className="mr-1 font-light">{prefix}</div>}
      {options.map((opt, i) => (
        <button 
        className={`${i > 0 ? "ml-1" : null} ${getter() === opt ? ("font-semibold") : ("opacity-50 hover:opacity-80")}`}
        onClick={e => setter(opt)}>
        {opt}
      </button>
      ))}
      {suffix && <div className="ml-1 font-light">{suffix}</div>}
    </div>
  )
}