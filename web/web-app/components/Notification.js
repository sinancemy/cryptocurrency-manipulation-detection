import { IoClose } from "react-icons/io5"
import { MultipurposeCard } from "./MultipurposeCard"

export const Notification = ({ notification, onDiscard }) => {

  return (
    <div className={`cursor-default text-xs`}>
      <MultipurposeCard colorizer={() => "blue-50"} hoverColorizer={() => "gray-900"} >
        <MultipurposeCard.Left>
          <div className={`px-3 py-4 text-lg ${!notification.read && 'text-red-700'}`}>
            !
          </div>
        </MultipurposeCard.Left>
        <MultipurposeCard.Middle>
          { notification.content }
        </MultipurposeCard.Middle>
        <MultipurposeCard.Right>
          <div className="pr-3">          
            <button onClick={onDiscard} className="opacity-70 hover:opacity-100">
              <IoClose />
            </button>
          </div>
        </MultipurposeCard.Right>
      </MultipurposeCard>
    </div>
  )
}