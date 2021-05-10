import { useCallback, useMemo, useState } from "react"
import { getCoinColor, getCoinIcon, getSourceColor, getSourceIcon, getSourceParts } from "../helpers"
import { NotifyButton } from "./NotifyButton"
import { FollowButton } from "./FollowButton"
import { MultipurposeCard } from "./MultipurposeCard"
import Link from "next/link"
import { TiAt } from "react-icons/ti"
import { CuteButton } from "./CuteButton"
import { useUser } from "../user-hook"
import { Trigger } from "./Trigger"
import { HiLightningBolt } from "react-icons/hi"
import { BsPlusCircleFill } from "react-icons/bs"
import { FiPlusCircle } from "react-icons/fi"

const mutedTextColor = "gray-500"
const bgColor = "gray-850"

export const FollowOverview = ({ follow }) => {

  const { updateUser } = useUser()
  const [selected, setSelected] = useState(false)
  const hasUsername = useMemo(() => follow.type === "source" && !follow.target.startsWith("*@"))
  const shownTargetName = useMemo(() => {
    if(follow.type === "coin") return follow.target.toUpperCase()
    if(!hasUsername) return getSourceParts(follow.target)[1]
    return follow.target
  }, [follow])
  const color = useMemo(() => follow.type === "coin" ? getCoinColor(follow.target) : getSourceColor(follow.target), [follow.type, follow.target])
  const icon = useMemo(() => follow.type === "coin" ? getCoinIcon(follow.target) : getSourceIcon(follow.target), [follow.type, follow.target])
  const newTrigger = useCallback((followId) => {
    updateUser("trigger/create", {
      follow_id: followId
    })
  }, [updateUser])

  return (
    <MultipurposeCard colorizer={() => "gray-850"} hoverColorizer={() => "gray-850"} aligned={false}>
    <MultipurposeCard.Left>
    </MultipurposeCard.Left>
    <MultipurposeCard.Middle>
        <div className={`flex flex-col space-y-2 text-xs text-${mutedTextColor} p-2`}>
          <div className={`flex flex-row justify-center items-center space-x-2 
                            text-lg text-${color}`}>
              {icon} 
              <span className="text-base truncate">
                {shownTargetName}
              </span>
              <div className="flex-grow">
              </div>
              <div className="flex flex-row space-x-2">
                { !hasUsername && <>
                <CuteButton onClick={() => setSelected(!selected)} color={`${selected ? 'gray-900' : 'gray-780'}`}>
                  <div className="flex flex-row space-x-1 items-center">
                    <span><HiLightningBolt /></span>
                    <span>{ follow.triggers.length }</span>
                    <span>triggers</span>  
                  </div>
                </CuteButton>
                <NotifyButton followType={follow.type} followTarget={follow.target} />
                </>
                }
                <FollowButton followType={follow.type} followTarget={follow.target} />
              </div>
          </div>
          { selected && !hasUsername && (
            <div className="flex flex-col space-y-2 lex-none">
              <div className={`flex flex-col space-y-1 max-h-36 overflow-scroll`}>
              { follow.triggers.map(trigger => (
                <Trigger trigger={trigger} />
              ))}
              { follow.triggers.length < 3 && (
                <div className="flex flex-row text-sm justify-center items-center space-x-1 rounded py-2 bg-gray-900">
                  <button className="flex flex-row items-center space-x-1 hover:text-white" onClick={() => newTrigger(follow.id)}>
                    <FiPlusCircle />
                    <span>New</span>
                  </button>
                </div>
                )}
              </div>
            </div> )}
        </div>
    </MultipurposeCard.Middle>
    <MultipurposeCard.Right>
    </MultipurposeCard.Right>
  </MultipurposeCard>
  )
}