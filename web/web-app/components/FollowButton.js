import axios from "axios";
import { useCallback, useState } from "react";
import { CuteButton } from "./CuteButton";

export const FollowButton = ({ queryUrl, queryParams, isFollowing, onFollow, onUnfollow }) => {

    const [disabled, setDisabled] = useState(false)

    const toggleFollow = () => {
        setDisabled(true)
        const unfollow = isFollowing() ? 1 : 0
        axios.get(queryUrl, {
            params: {
                ...queryParams,
                unfollow: unfollow
            }
        })
        .then(resp => {
          console.log(resp.data)
          if(resp.data.result === "ok") {
            if(unfollow === 1) {
              onUnfollow()
            } else {
              onFollow()
            }
            setDisabled(false)
          }
        })
    }

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
