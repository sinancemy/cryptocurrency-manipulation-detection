import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import { IoChatbubblesSharp } from "react-icons/io5"
import { dateToString, getCoinIcon, getSourceColor, getSourceIcon } from "../helpers"
import { MultipurposeCard } from "./MultipurposeCard"
import { MiniImpact } from "./MiniImpact"
import Link from "next/link"
import { BsChevronCompactDown } from "react-icons/bs"
import {MdTimelapse} from "react-icons/md"

const mutedColor = "gray-500"
const innerColor = "gray-850"
const innerBorderColor = "gray-800"

export const PostOverview = ({ post }) => {

  const [selected, setSelected] = useState(false)
  const contentRef = useRef(null)

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

  const [isOverflown, setIsOverflown] = useState(false)

  useLayoutEffect(() => {
    if(!contentRef.current) return
    if (contentRef.current.clientHeight < contentRef.current.scrollHeight) {
      setIsOverflown(true);
    }
  }, [contentRef])

  const shouldShowExpander = useMemo(() => isOverflown && !selected, [isOverflown, selected])

  return (
    <MultipurposeCard badgeColor={getSourceColor(post.user + '@' + post.source)} aligned={false}>
      <MultipurposeCard.Left>
        <div className={`flex flex-col px-4 py-2 w-32`}>
          <span className="font-semibold width-50 truncate hover:underline">
            <Link href={`/user-info?user=${post.user}@${post.source}`}>
              {post.user}
            </Link>
          </span>
          <div className={`py-1 flex flex-row items-center text-xs text-${mutedColor}`}>
            <span className="mr-1">
                {getSourceIcon(post.user + '@' + post.source)}
            </span>
            <span className="truncate hover:underline">
              <Link href={`/source-info?source=*@${post.source}`}>
                {post.source}
              </Link>
            </span>
          </div>
          <div className={`flex flex-row items-center text-xs text-${mutedColor}`}>
            <span className="mr-1">
              { getCoinIcon(post.coin_type) }
            </span>
            <span className={`text-xs text-${mutedColor} truncate hover:underline`}>
              <Link href={`/coin-info?coin=${post.coin_type}`}>
                { post.coin_type.toUpperCase() }
              </Link>
            </span>
          </div>
        </div>
      </MultipurposeCard.Left>
      <MultipurposeCard.Middle>
        <div className={`flex flex-col justify-between bg-${innerColor} border border-${innerBorderColor} mx-4 my-2 rounded relative`}>
          <div className={`${selected ? "max-h-48 overflow-scroll" : "h-16 overflow-hidden"} px-4 py-2`}
              ref={contentRef}>
            {post.content}
          </div>
          { shouldShowExpander &&
          <p className={`absolute left-0 right-0 bottom-0 w-full h-8 flex flex-col items-center justify-end 
          text-transparent hover:text-white font-semibold bg-gradient-to-t from-${innerColor} 
          ${!selected && 'cursor-pointer'}`} onClick={() => setSelected(!selected)}>
            <BsChevronCompactDown />
            </p> 
          }
        </div>
      </MultipurposeCard.Middle>
      <MultipurposeCard.Right>
        <div className={`flex px-4 py-2 flex-col w-32`}>
          { post.streamed ? (
            <div className={`px-2 py-1 flex flex-row space-x-1 items-center lg:justify-end text-gray-300`}>
              <span className={"text-sm"}><MdTimelapse /></span>
              <span className={"text-xs"}>Streamed</span>
            </div>
          ) : (
          <>
            <div className={`px-2 py-1 flex flex-row items-center lg:justify-end text-${getInteractionColor(post.interaction)}`}>
              <span className="mr-1">
                {post.interaction}
              </span>
              <IoChatbubblesSharp />
            </div>
            <div className={`px-2 flex flex-row lg:justify-end text-${mutedColor}`}>
              <MiniImpact avgImpact={post.avg_impact} impact={post.impact} />
            </div>
          </>
          )}
          <div className={`flex py-1 items-center flex-row lg:justify-end text-xs text-${mutedColor} truncate`}>
            <span>
              {dateToString(new Date(post.time*1000))}
            </span>
          </div>
        </div>
      </MultipurposeCard.Right>
    </MultipurposeCard>
    )
}