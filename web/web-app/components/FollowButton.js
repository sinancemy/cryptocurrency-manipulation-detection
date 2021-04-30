import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useRequireLogin, useUser } from "../user-helpers";
import { CuteButton } from "./CuteButton";

export const FollowButton = ({ followEndpoint, params, isFollowing }) => {
    const { user, updateUser } = useUser()
    const [disabled, setDisabled] = useState(false)

    const toggleFollow = () => {
        setDisabled(true)
        const unfollow = isFollowing() ? 1 : 0
        updateUser(followEndpoint, {
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
