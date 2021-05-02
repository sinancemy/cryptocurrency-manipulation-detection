
import { useRequireLogin, useUser } from "../../user-hook"
import Dashboard from "../../components/Dashboard"
import { useCallback, useEffect, useState } from "react"
import { CuteButton } from "../../components/CuteButton"
import { AiOutlineLoading } from "react-icons/ai"

export default function DashboardPage() {  
  useRequireLogin()
  const { user } = useUser()
  const ticks = 1000
  const updateTime = 20000
    // Original: 1583625601
  const [currentTime, setCurrentTime] = useState(1573625601)
  const [autoUpdate, setAutoUpdate] = useState(false)
  const [remTime, setRemTime] = useState(updateTime)
  const [hover, setHover] = useState(false)

  const updateCurrentTime = () => {
    if(!autoUpdate) return
    setCurrentTime(currentTime => currentTime + 1000000)
    return false
  }

  useEffect(() => {
    if(!autoUpdate) {
      setRemTime(updateTime)
      return
    }
    const countDownInterval = setInterval(() => {
        setRemTime(remTime => (remTime - ticks < 0) ? updateCurrentTime() || updateTime : remTime - ticks)
    }, ticks)
    return () => clearInterval(countDownInterval)
  }, [autoUpdate])

  return (
    <div className="mx-10 mt-3">
      <Dashboard user={user} currentTime={currentTime} setAutoUpdate={setAutoUpdate} />
      <div className="flex flex-col fixed space-y-1 z-100 right-9 bottom-10 w-32 p-3 rounded-md text-white text-xs bg-black opacity-95 hover:opacity-100"
            >
        <div>Auto-update</div>
          <div className="flex flex-row items-center space-x-1">
          {autoUpdate ? <>
              <AiOutlineLoading className={`text-green-600 animate-spin mr-2`} />
              <span className="text-green-600">In {remTime/1000} s</span>
            </> : <>
              <span className="text-gray-500">
                Disabled.
              </span>
            </>}
          </div> 
          <CuteButton onClick={() => setAutoUpdate(!autoUpdate)} 
            color={"black"} 
            borderColor={"gray-500"}
            hoverColor={"black"}
            hoverBorderColor={"white"}>
            { autoUpdate ? "Disable" : "Enable" }
          </CuteButton>
      </div>
    </div>
  )
}