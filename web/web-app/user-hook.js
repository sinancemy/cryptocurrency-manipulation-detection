import axios from "axios";
import { useRouter } from "next/router";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useCookies } from "react-cookie";
import { HOST } from "./helpers";

// Create the context.
const UserContext = createContext()

// The provider component.
export const UserProvider = ({ children }) => {
  // Populate the context.
  const user = useUserProvider()
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

// Any descendant of AuthProvider component will have access to the authentication context.
// The authentication context is simply a global hook.
export const useUser = () => useContext(UserContext)

// Represents an unauthenticated user.
const guestUser = {
  follows: [],
  id: -1,
  username: "guest"
}
// Custom Hook to get user info.
const useUserProvider = () => {
  const [cookies, setCookie, removeCookie] = useCookies(['token'])
  const [user, setUser] = useState(null)

  // Helper function.
  const fetch = useCallback((endpoint, params, then, withToken = true) => {
    axios.post(HOST + '/user/' + endpoint, {
      ...params,
      token: withToken ? cookies["token"] : null
    }).then(then)
  }, [cookies])
  // Fetch the user (for internal use)
  const updateUserInfo = useCallback(() => {
    fetch("info", {}, (res) => {
      if(res && res.data && res.data.result === "ok") {
        setUser(res.data.userinfo)
      } else {
        console.log("Error: " + res.data.error_msg)
        if(cookies["token"]) removeCookie("token")
        setUser(guestUser)
      }
    })
  }, [cookies])
  // Run on render or when the token changes.
  useEffect(updateUserInfo, [cookies])
  // Update the user with the given parameters.
  const updateUser = useCallback((endpoint, params) => {
    fetch(endpoint, params, (res) => {
      if(res && res.data && res.data.result === "ok") {
        updateUserInfo() 
      }
    })
  }, [cookies])
  // Log the user in.
  const login = useCallback((username, password, onError = () => {}) => {
    fetch("login", { 
      username: username, 
      password: password 
    }, (res) => {
      if(res.data.result === "ok") {
        setCookie("token", res.data.token)
      } else {
        onError(res.data)
      }
    }, false)
  }, [])
  // Log the user out.
  const logout = useCallback(() => {
    fetch("logout", {}, () => removeCookie("token"))
  }, [])
  // Register a new user.
  const register = useCallback((username, password, email, onSuccess = () => {}, onError = () => {}) => {
    fetch("register", {
      username: username, 
      password: password, 
      email: email
    }, (res) => {
      if(res.data.result === "ok") {
        onSuccess(username, password)
      } else {
        onError(res.data)
      }
    }, false)
  }, [])
 // Send reset mail.
 const send_mail = useCallback((email, onSuccess = () => {}, onError = () => {}) => {
  fetch("send_mail", { 
    email: email, 
  }, (res) => {
    if(res.data.result === "ok") {
      onSuccess(email)
    } else {
      onError(res.data)
    }
  }, false)
}, [fetch])
// Update password
const change_password = useCallback((oldPassword, newPassword, onSuccess = () => {}, onError = () => {}) => {
  fetch("change_password", { 
    oldPassword: oldPassword, 
    newPassword: newPassword
  }, (res) => {
    if(res.data.result === "ok") {
      onSuccess(oldPassword, newPassword)
    } else {
      onError(res.data)
    }
  }, true)
}, [fetch])
// Update email
const change_email = useCallback((password, newEmail, onSuccess = () => {}, onError = () => {}) => {
  fetch("change_email", { 
    password: password, 
    newEmail: newEmail
  }, (res) => {
    if(res.data.result === "ok") {
      onSuccess(password, newEmail)
    } else {
      onError(res.data)
    }
  }, true)
}, [fetch])
  // Deletes the user.
  const delete_user = useCallback(() => {
    fetch("delete_user", {}, () => removeCookie("token"))
  }, [fetch])

  // Notification stuff...
  // By default, the notifications are empty, unless updateNotifications is called at least once!
  const [notifications, setNotifications] = useState([])
  // Update the notifications.
  const updateNotifications = useCallback(() => {
    fetch("info/notifications", {}, (res) => {
      if(res.data.result == "ok") setNotifications(res.data.notifications)
    })
  }, [cookies])
  // Set all the notifications as read and update the notifications.
  const readAllNotifications = useCallback(() => {
    fetch("info/notifications/read_all", {}, updateNotifications)
  }, [cookies])
  // Discard a notification and update the notifications.
  const discardNotification = useCallback((id) => {
    fetch("info/notifications/delete", { id: id }, updateNotifications)
  }, [cookies])

  const username = useMemo(() => user ? user.username : "...")
  const email = useMemo(() => user ? user.email : "...")
  const loggedIn = useMemo(() => user && user.id >= 0, [user])
  const followedCoins = useMemo(() => user ? user.follows.filter(f => f.type === "coin" ) : [], [user])
  const followedSources = useMemo(() => user ? user.follows.filter(f => f.type === "source") : [], [user])
  const isFollowing = useCallback((type, target) => {
    return (type === "coin" ? followedCoins : followedSources).some((follow) => follow.target === target)
  }, [followedCoins, followedSources])
  const areNotificationsOn = useCallback((type, target) => {
    return (type === "coin" ? followedCoins : followedSources).some((follow) => follow.target === target && follow.notify_email)
  }, [followedCoins])

  // Expose data and methods.
  return { user: user, loggedIn: loggedIn, username: username, email: email, register: register, login: login, updateUser: updateUser,
          notifications: notifications, updateNotifications: updateNotifications, readAllNotifications: readAllNotifications, discardNotification: discardNotification,
          followedCoins: followedCoins, followedSources: followedSources, 
          isFollowing: isFollowing, areNotificationsOn: areNotificationsOn, 
          refetchUser: updateUserInfo, logout: logout, delete_user: delete_user, send_mail: send_mail, fetch: fetch, change_password: change_password, change_email: change_email }
}

// Custom Hook to redirect to the login page if needed.
export const useRequireLogin = () => {
  const { user, loggedIn } = useUser()
  const router = useRouter()
  useEffect(() => {
    // Wait until the user info is fetched.
    if(!user) return
    if(!loggedIn) {
      router.push("/login")
    }
  }, [loggedIn, user, router])
}

// Custom Hook to redirect to the dashboard page if needed.
export const useRequireGuest = () => {
  const { user, loggedIn } = useUser()
  const router = useRouter()
  useEffect(() => {
      // Wait until the user info is fetched.
    if(!user) return
    if(loggedIn) {
      router.push("/dashboard")
    }
  }, [loggedIn, user, router])
}