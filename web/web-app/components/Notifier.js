import { useEffect, useMemo, useState } from "react"
import { IoNotifications, IoNotificationsOutline } from "react-icons/io5"
import { useUser } from "../user-hook"
import { Notification } from "./Notification"

const pollTime = 3000

export const Notifier = () => {
  const { refetchUser, unreadNotifications } = useUser()
  const [selected, setSelected] = useState(false)
  const unreadCount = useMemo(() => unreadNotifications.length, [unreadNotifications])

  useEffect(() => {
    const refetchInterval = setInterval(refetchUser, pollTime)
    return () => clearInterval(refetchInterval)
  }, [])

  return (
      <div className="relative">
        <button onClick={() => setSelected(!selected)}>
          <span class="relative inline-block">
            { unreadCount > 0 ? <IoNotifications /> : <IoNotificationsOutline />}
            { unreadCount > 0 &&
            <span class="absolute text-xs top-0 right-0 transform translate-x-1/2 -translate-y-1/2 px-1 bg-red-600 rounded-lg">
              { unreadCount }
            </span>
            }
          </span>
        </button>
        {selected &&
          <div className="flex flex-col space-y-1 absolute top-6 right-2 p-2 
                          bg-gray-700 border border-gray-800 z-50 text-sm rounded-b-md rounded-tl-md w-72 shadow-lg 
                          max-h-48 overflow-scroll">
              {unreadNotifications.length > 0 ? unreadNotifications.map(notif => (
                  <Notification notif={notif} />
              )) : "No new notifications."}
          </div>
        }
      </div>
  )
}