import { useCallback } from "react"
import { HiLightningBolt } from "react-icons/hi"
import { IoClose } from "react-icons/io5"
import { useUser } from "../user-hook"
import { SimpleCycler } from "./SimpleCycler"
import { SimpleDropdown } from "./SimpleDropdown"

export const Trigger = ({ trigger }) => {

  const { updateUser } = useUser()
  const deleteTrigger = useCallback(() => {
    updateUser("trigger/delete", {
      id: trigger.id
    })
  }, [updateUser, trigger])

  const updateTimeWindow = useCallback((timeWindow) => {
    updateUser("trigger/update", {
      id: trigger.id,
      time_window: timeWindow
    })
  }, [updateUser, trigger])
  
  const updateThreshold = useCallback((threshold) => {
    console.log(threshold)
    updateUser("trigger/update", {
      id: trigger.id,
      threshold: threshold
    })
  }, [updateUser, trigger])

  return (
    <div className="flex flex-row items-center justify-between rounded px-4 py-2 bg-gray-900">
      <div className="flex flex-row justify-center items-center space-x-1">
        <HiLightningBolt />
        <div>Notify when the posts increase by</div>
        <div>
          <SimpleDropdown options={["0%", "1%", "5%", "10%", "15%", "20%", "50%"]} selected={trigger.threshold + "%"}
            setSelected={(t) => updateThreshold(t.substring(0, t.length-1))} />
        </div>
        <div>within the last </div>
        <div>
          <SimpleDropdown options={["5m", "10m", "30m", "1h", "5h", "12h", "1d"]} selected={trigger.time_window} setSelected={updateTimeWindow} />
        </div>
      </div>
      <div className="text-base">
        <button onClick={deleteTrigger} className="text-gray-700 hover:text-white">
          <IoClose />
        </button>
      </div>
    </div>
  )
}