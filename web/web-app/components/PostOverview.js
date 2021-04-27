import { useCallback, useState } from "react"
import { IoChatbubblesSharp } from "react-icons/io5"
import { dateToString, getSourceColor, getSourceIcon } from "../Helpers"

const textColor = "gray-200"
const mutedColor = "gray-500"
const color = "gray-900"
const innerColor = "gray-800"

export const PostOverview = ({ post }) => {

  const [selected, setSelected] = useState(false)

  const getInteractionColor = useCallback((score) => {
    return (score > 1000)? "red-500"
          : (score > 500) ? "green-600" 
          : (score > 200) ? "green-500"
          : (score > 100) ? "green-300"
          : (score > 80) ? "yellow-600"
          : (score > 60) ? "yellow-500"
          : (score > 40) ? "yellow-300"
          : mutedColor

  }, [post])

  return (
    <div className="flex flex-row mb-2">
      <div className={`w-1.5 bg-${getSourceColor(post.user + '@' + post.source)} rounded-l`}></div>
      <div className={`grid grid-cols-6 gap-1 py-2 px-4 w-full text-${textColor} bg-${color} border border-${innerColor} rounded-r`}>
        <div className={`flex flex-col`}>
          <span className="font-semibold width-50 truncate">
            {post.user}
          </span>
          <div className={`py-1 flex flex-row items-center text-xs text-${mutedColor}`}>
            <span className="mr-1">
              {getSourceIcon(post.user + '@' + post.source)}
            </span>
            <span className="truncate">
              {post.source}
            </span>
          </div>
          <span className={`text-xs text-${mutedColor}`}>
            { post.unique_id.slice(2) }
          </span>
        </div>
        <div 
          className={`col-span-4 ${!selected && 'max-h-16'} overflow-hidden bg-${innerColor} 
                      px-4 py-2 rounded ${!selected && 'cursor-pointer'}`}
          onClick={() => setSelected(!selected)}>
          <p>
            {post.content}
          </p>
        </div>
        <div className={`flex flex-col`}>
          <div className={`px-2 py-1 flex flex-row items-center justify-end text-${getInteractionColor(post.interaction)}`}>
            <IoChatbubblesSharp />
            <span className="ml-1">
              {post.interaction}
            </span>
          </div>
          <div className={`truncate px-2 py-1 flex flex-row text-xs justify-end text-${mutedColor}`}>
            <span>
              {dateToString(new Date(post.time*1000))}
            </span>
          </div>
        </div>
      </div>
    </div>
    )
}