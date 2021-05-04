import { useEffect, useState } from "react";
import { RiMailCheckLine, RiMailCloseLine } from "react-icons/ri";
import { useUser } from "../user-hook";
import { CuteButton } from "./CuteButton";

export const NotifyButton = ({ followType, followTarget }) => {
    const { user, updateUser, areNotificationsOn } = useUser()
    const [disabled, setDisabled] = useState(false)
    const toggleNotify = () => {
        setDisabled(true)
        updateUser("follow/update", {
          type: followType,
          target: followTarget,
          notify: !areNotificationsOn(followType, followTarget)
        })
    }
    useEffect(() => {
      setDisabled(false)
    }, [user])

    return (
        <CuteButton
            onClick={() => toggleNotify()}
            textColor={ !areNotificationsOn(followType, followTarget) ? "yellow-400" : "green-400" }
            fullWidth={true}
            isDisabled={() => disabled}
            size={"lg"}>
        { areNotificationsOn(followType, followTarget) ? (
          <RiMailCheckLine />) : (<RiMailCloseLine />) }
      </CuteButton>
    );
  }
