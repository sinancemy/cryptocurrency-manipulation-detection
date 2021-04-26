import { useCallback, useEffect, useState } from "react"

export const SourceCard = ({ 
                            source,
                            checkbox = true,
                            isSelected,
                            onToggle,
                            nameColorMap =  [["twitter", "blue"], ["reddit", "red"]]
                          }) => {

  const getSourceParts = useCallback(() => {
    const [username, src] = source.split("@")
    return [username, src]
  }, [source])

  const hasUser = useCallback(() => {
    return getSourceParts()[0] !== "*"
  }, [source])

  const getColor = useCallback(() => {
    for(const e of nameColorMap) {
      if(getSourceParts()[1].includes(e[0])) return e[1]
    }
    return "gray"
  }, [source])

  return (
      <label
        className={`flex flex-row flex-justify-between shadow-sm border border-gray-200 text-sm w-full px-3 py-1 rounded rounded-md
          bg-${getColor()}-${isSelected() ? '200' : '100'}
          hover:bg-${getColor()}-200
          ${isSelected() ? 'border border-gray-300' : ''}
        `}
      >
        <div className="mr-2">
          { checkbox && (<input 
            type="checkbox"
            onClick={onToggle}
            checked={isSelected()}
          />) }
        </div>
        { hasUser() ? (
          <>
            <div className="truncate w-24">
              { getSourceParts()[0] }
            </div>
            <div className="flex-grow"></div>
            <div className="text-xs font-light align-bottom">
              { getSourceParts()[1] }
            </div>
          </>
        ) : 
          <div class="">
            { getSourceParts()[1] }
          </div>
        }
      </label>
  )
  }