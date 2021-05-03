import { useEffect, useState } from "react";
import { useUser } from "../user-hook";
import { CuteButton } from "./CuteButton";

export const FollowButton = ({ params, isFollowing }) => {
    const { user, updateUser } = useUser()
    const [disabled, setDisabled] = useState(false)

    const toggleFollow = () => {
        setDisabled(true)
        const unfollow = isFollowing() ? 1 : 0
        updateUser("follow", {
          ...params,
          unfollow: unfollow
        })
    }

    useEffect(() => {
      setDisabled(false)
    }, [user])

    return (
        <CuteButton
            onClick={() => toggleFollow()}
            textColor={ isFollowing() ? "yellow-400" : "green-400" }
            fullWidth={true}
            isDisabled={() => disabled}
            width={24}>
        { isFollowing() ? "Unfollow" : "Follow" }
      </CuteButton>
    );
  }
