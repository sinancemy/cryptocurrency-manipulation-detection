import { useEffect, useState } from "react";
import { useUser } from "../user-hook";
import { CuteButton } from "./CuteButton";

export const FollowButton = ({ followType, followTarget }) => {
    const { user, updateUser, isFollowing } = useUser()
    const [disabled, setDisabled] = useState(false)
    const toggleFollow = () => {
        setDisabled(true)
        const endpoint = isFollowing(followType, followTarget) ? "follow/delete" : "follow/create"
        updateUser(endpoint, {
          type: followType,
          target: followTarget,
          notify: false,
        })
    }
    useEffect(() => {
      setDisabled(false)
    }, [user])

    return (
        <CuteButton
            onClick={() => toggleFollow()}
            textColor={ isFollowing(followType, followTarget) ? "yellow-400" : "green-400" }
            fullWidth={true}
            isDisabled={() => disabled}
            width={24}>
        { isFollowing(followType, followTarget) ? "Unfollow" : "Follow" }
      </CuteButton>
    );
  }
