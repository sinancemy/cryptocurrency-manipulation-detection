import { useCallback } from "react"
import { IoClose } from "react-icons/io5"
import { dateToString, getCoinIcon, getSourceIcon, getSourceParts } from "../Helpers"
import { useUser } from "../user-hook"
import { CuteButton } from "./CuteButton"
import { MultipurposeCard } from "./MultipurposeCard"

export const Notification = ({ notif }) => {

  const { updateUser } = useUser()
  const discardNotification = useCallback(() => {
    updateUser("discard_notification", {notif_id: notif.id, notif_type: notif.type})
  })

  return (
    <div className={`cursor-default text-xs`}>
      <MultipurposeCard colorizer={() => "blue-50"} hoverColorizer={() => "gray-900"} >
        <MultipurposeCard.Left>
          <div className="px-3 py-4 text-lg">
            {notif.type === "coin" ? getCoinIcon(notif.coin_type) : getSourceIcon(notif.source)}
          </div>
        </MultipurposeCard.Left>
        <MultipurposeCard.Middle>
          Unusual movement in <br />
        {notif.type === "coin" ? notif.coin_type.toUpperCase() 
                                : (notif.source.startsWith("*@")) ? getSourceParts(notif.source)[1]
                                                                  : notif.source}
        </MultipurposeCard.Middle>
        <MultipurposeCard.Right>
          <div className="pr-3">          
            <button onClick={discardNotification} className="opacity-70 hover:opacity-100">
              <IoClose />
            </button>
          </div>
        </MultipurposeCard.Right>
      </MultipurposeCard>
    </div>
  )
}