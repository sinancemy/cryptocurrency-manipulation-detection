
import { useEffect, useState } from "react"
import { AiOutlineLoading } from "react-icons/ai"

export default function AutoUpdater({ onTimedUpdate }) { 
  const ticks = 1000
  const updateTime = 20000
    // Original: 1583625601
  const [enabled, setEnabled] = useState(false)
  const [remTime, setRemTime] = useState(updateTime)
  const [hover, setHover] = useState(false)

  const updateCurrentTime = () => {
    if(!enabled) return
    onTimedUpdate()
    return false
  }

  useEffect(() => {
    if(!enabled) {
      setRemTime(updateTime)
      return
    }
    const countDownInterval = setInterval(() => {
        setRemTime(remTime => (remTime - ticks < 0) ? updateCurrentTime() || updateTime : remTime - ticks)
    }, ticks)
    return () => clearInterval(countDownInterval)
  }, [enabled])

  return (
      <div className="flex flex-row items-center space-x-1 rounded-md opacity-95 hover:opacity-100 text-sm"
            onMouseOver={() => setHover(true)}
            onMouseOut={() => setHover(false)}>
      {!hover ? (
        enabled ? 
          <>
            <AiOutlineLoading className={`text-green-600 animate-spin`} />
            <span className="text-green-600">In {remTime/1000} s</span>
          </> : <>
            <span></span>
            <div className="text-gray-500">
              Auto-update disabled.
            </div>
          </>
      ) : (
        <button onClick={() => setEnabled(!enabled)} className={`w-full ${enabled ? "text-red-600" : "text-green-600"}`}>
            { enabled ? "Disable" : "Enable" } auto-update
        </button>
      )}
      </div>
  )
}