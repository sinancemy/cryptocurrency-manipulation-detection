import { useEffect, useState } from "react";
import { IoNotificationsOffOutline, IoNotificationsOutline } from "react-icons/io5";
import { useUser } from "../user-hook";
import { CuteButton } from "./CuteButton";

export const NotifyButton = ({ params, areNotificationsOn }) => {
    const { user, updateUser } = useUser()
    const [disabled, setDisabled] = useState(false)

    const toggleFollow = () => {
        setDisabled(true)
        const toggleNotifyFlag = areNotificationsOn() ? 0 : 1
        updateUser("follow", {
          ...params,
          notify: toggleNotifyFlag
        })
    }
    useEffect(() => {
      setDisabled(false)
    }, [user])

    return (
        <CuteButton
            onClick={() => toggleFollow()}
            textColor={ areNotificationsOn() ? "yellow-400" : "green-400" }
            fullWidth={true}
            isDisabled={() => disabled}
            size={"lg"}>
        { !areNotificationsOn() ? (<IoNotificationsOutline />) : (<IoNotificationsOffOutline />) }
      </CuteButton>
    );
  }
