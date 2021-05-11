import { useCallback, useEffect, useMemo, useState } from "react"
import { IoNotifications, IoNotificationsOutline } from "react-icons/io5"
import { Arrow, useLayer } from "react-laag"
import { useUser } from "../user-hook"
import { Notification } from "./Notification"

const pollTime = 10000

export const Notifier = () => {
  const { notifications, updateNotifications, readAllNotifications, discardNotification } = useUser()
  const [selected, setSelected] = useState(false)
  const [selectedFirstUpdate, setSelectedFirstUpdate] = useState(true)
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  useEffect(() => {
    const refetchInterval = setInterval(updateNotifications, pollTime)
    return () => clearInterval(refetchInterval)
  }, [updateNotifications])

  useEffect(() => {
    if(selected) return
    if(selectedFirstUpdate) {
      setSelectedFirstUpdate(false)
      return
    }
    readAllNotifications()
  }, [selected, readAllNotifications])

  const {
    triggerProps,
    layerProps,
    renderLayer
  } = useLayer({
    isOpen: selected,
    onOutsideClick: () => setSelected(false),
    placement: "bottom-end",
    triggerOffset: 8,
    arrowOffset: 8,
  });

  return (
      <div>
        <button {...triggerProps} onClick={() => setSelected(!selected)}>
          <span className="relative inline-block">
            <IoNotifications />
            { unreadCount > 0 &&
            <span class="absolute text-xs top-0 right-0 transform translate-x-1/2 -translate-y-1/2 px-1 bg-red-600 rounded-lg">
              { unreadCount }
            </span>
            }
          </span>
        </button>
        {selected && renderLayer(
          <div {...layerProps}>
            <div className="flex flex-col space-y-1 
                            p-2 bg-blue-50 border border-gray-700 text-sm rounded-md w-72 shadow 
                            max-h-48 overflow-scroll text-white">
              {notifications.length > 0 ? notifications.map(notification => (
                  <Notification notification={notification} onDiscard={() => discardNotification(notification.id)} />
              )) : "No new notifications."}
            </div>
          </div>
        )}
      </div>
  )
}