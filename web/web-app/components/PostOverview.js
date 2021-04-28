import { useCallback, useState } from "react"
import { IoChatbubblesSharp } from "react-icons/io5"
import { FaCode } from "react-icons/fa"
import { dateToString, getSourceColor, getSourceIcon } from "../Helpers"
import { MultipurposeCard } from "./MultipurposeCard"

const mutedColor = "gray-500"
const innerColor = "gray-850"
const innerBorderColor = "gray-800"

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
    <MultipurposeCard badgeColor={getSourceColor(post.user + '@' + post.source)} disperse={true}>
      <MultipurposeCard.Left>
        <div className={`flex flex-col w-32`}>
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
          <div className={`flex flex-row items-center text-xs text-${mutedColor}`}>
            <span className="mr-1">
              <FaCode />
            </span>
            <span className={`text-xs text-${mutedColor} font-mono`}>
              { post.unique_id.slice(2) }
            </span>
          </div>
        </div>
      </MultipurposeCard.Left>
      <MultipurposeCard.Middle>
        <div className="px-4">
          <div 
            className={`${!selected && 'max-h-16'} overflow-hidden bg-${innerColor} border border-${innerBorderColor} 
              px-4 py-2 rounded ${!selected && 'cursor-pointer'}`}
            onClick={() => setSelected(!selected)}>
            <p>
              {post.content}
            </p>
          </div>
        </div>
      </MultipurposeCard.Middle>
      <MultipurposeCard.Right>
        <div className={`flex flex-col w-32`}>
          <div className={`px-2 py-1 flex flex-row items-center justify-end text-${getInteractionColor(post.interaction)}`}>
            <IoChatbubblesSharp />
            <span className="ml-1">
              {post.interaction}
            </span>
          </div>
          <div className={`px-2 py-1 flex flex-row text-xs justify-end text-${mutedColor}`}>
            <span>
              {dateToString(new Date(post.time*1000))}
            </span>
          </div>
        </div>
      </MultipurposeCard.Right>
    </MultipurposeCard>
    )
}