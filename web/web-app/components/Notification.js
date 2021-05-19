import { IoClose } from "react-icons/io5"
import { MultipurposeCard } from "./MultipurposeCard"

export const Notification = ({ notification, onDiscard }) => {

  return (
    <div className={`flex flex-row space-x-2 items-center cursor-default text-xs`}>
      <div className={`text-lg ${!notification.read && 'text-red-700'}`}>
        !
      </div>
      <div className="truncate">
        { notification.content }
      </div>
      <span className="flex-grow"></span>
      <button onClick={onDiscard} className="opacity-70 hover:opacity-100">
        <IoClose />
      </button>
    </div>
  )
}