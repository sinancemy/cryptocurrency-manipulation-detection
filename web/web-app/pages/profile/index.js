import { DashboardPanel } from "../../components/DashboardPanel"
import { useRequireLogin, useUser } from "../../user-hook"
import { FollowOverview } from "../../components/FollowOverview"
import { TabbedView } from "../../components/TabbedView"
import { SimpleMenu } from "../../components/SimpleMenu"
import { useCallback, useMemo, useState } from "react"
import { MenuPages } from "../../components/MenuPages"
import { FormInput2 } from "../../components/FormInput2";
import Link from "next/link"

export default function Profile() {
  useRequireLogin()
  const { username, followedCoins, followedSources, areCoinNotificationsOn, areSourceNotificationsOn, delete_user } = useUser()
  const followedGroups = useMemo(() => followedSources.filter(f => f.target.startsWith("*@")), [followedSources])
  const followedUsers = useMemo(() => followedSources.filter(f => !f.target.startsWith("*@")), [followedSources])
  const [oldPassword, setOldPassword] = useState(null)
  const [correctPassword, setCorrectPassword] = useState(null)
  const [correctReenteredPassword, setCorrectReenteredPassword] = useState(null)
  const [isLoading, setLoading] = useState(false);
  const [oldEmail, setOldEmail] = useState(null)
  const [correctEmail, setCorrectEmail] = useState(null)
  const [emailErrorMsg, setEmailErrorMsg] = useState("")

  // Username field checker.
  const simpleFieldChecker = useCallback((val) => {
    if (val === "") {
      return [false, "This field is required."]
    } else if (val.length < 5) {
      return [false, "Too short."]
    }
    return [true, null]
  }, [])

  const emailChecker = useCallback((val) => {
    const re = /^\S+@\S+$/
    const valid = re.test(val.toLowerCase())
    return [valid, "Invalid e-mail."]
  }, [])

  const canSubmit = useMemo(() => correctPassword && correctReenteredPassword, 
  [correctPassword, correctReenteredPassword])

  const [selectedPage, setSelectedPage] = useState(0)

  return (
    <div className="animate-fade-in-down">
      <div className="text-white bg-gray-900 mt-4">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img className="h-212 w-24" alt="profile picture" />
              <span className="text-xl ml-4">{username}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row pt-2 space-x-2 justify-center">
        <div className="">
          <DashboardPanel collapsable={false}>
            <DashboardPanel.Header>
              Menu
            </DashboardPanel.Header>
            <DashboardPanel.Body>
              <SimpleMenu 
                options={["Notification Settings", "Account Settings", "Delete Your Account"]} 
                onChange={setSelectedPage} />
            </DashboardPanel.Body>
          </DashboardPanel>
        </div>
        <div className="w-128">
          <MenuPages index={selectedPage}>
            <DashboardPanel restrictedHeight={false} collapsable={false}>
              <DashboardPanel.Header>
                Notification Settings
              </DashboardPanel.Header>
              <DashboardPanel.Body>
                <TabbedView options={["Followed Coins", "Followed Groups", "Followed Users"]}>
                  <div>
                    {followedCoins.length > 0 ? 
                      followedCoins.map(follow => (
                        <div className="mt-2">
                          <FollowOverview follow={follow} />
                        </div>
                      )) : ("Not following any coins.")}
                    </div>
                    <div>
                    {followedGroups.length > 0 ? (
                      followedGroups.map(follow => (
                        <div className="mt-2">
                          <FollowOverview follow={follow} />
                        </div>
                      ))
                    ) : ("Not following any groups.")}
                    </div>
                    <div>
                    {followedUsers.length > 0 ? (
                      followedUsers.map(follow => (
                        <div className="mt-2">
                          <FollowOverview follow={follow} />
                        </div>
                      ))
                    ) : ("Not following any users.")}
                    </div>
                  </TabbedView>
              </DashboardPanel.Body>
            </DashboardPanel>
            <DashboardPanel restrictedHeight={false} collapsable={false}>
              <DashboardPanel.Header>
                Account Settings
              </DashboardPanel.Header>
              <DashboardPanel.Body>
              <TabbedView options={["Change Email", "Change Password"]}>
                  <div>
                  <FormInput2 type={"text"} 
                     type={"text"} 
                     label={"Enter Old E-mail"} 
                     placeholder={"Your e-mail"} 
                     errorMsg={emailErrorMsg}
                     isDisabled={isLoading} 
                     checker={emailChecker}
                     setCorrectValue={setOldEmail}  />
                    <FormInput2 type={"text"} 
                      label={"Enter New E-mail"} 
                      placeholder={"New e-mail"} 
                      errorMsg={emailErrorMsg}
                      isDisabled={isLoading} 
                      checker={(val) => [val !== oldEmail, "Your new e-mail cannot be same as your old e-mail"]} 
                      setCorrectValue={setCorrectEmail}  />
                    <button
                        type="submit"
                        disabled={!canSubmit || isLoading}
                        class="w-full bg-yellow-50 text-blue-50 h-10 py-2 px-4 text-center rounded disabled:opacity-50 hover:bg-yellow-500" >
                        {isLoading ? (
                        <AiOutlineLoading className={`animate-spin`} />
                        ) : (
                          "Change Email"
                        )}
                    </button>
                    </div>
                    <div>
                    <FormInput2 type={"password"} 
                      label={"Enter Old Password"} 
                      placeholder={"Old password"} 
                      errorMsg={""}
                      isDisabled={isLoading} 
                      checker={simpleFieldChecker} 
                      setCorrectValue={setOldPassword}  />
                    <FormInput2 type={"password"} 
                      label={"Enter New Password"} 
                      placeholder={"New password"} 
                      errorMsg={""}
                      isDisabled={isLoading} 
                      checker={(val) => [val !== oldPassword, "Your new password cannot be same as your old password"]} 
                      setCorrectValue={setCorrectPassword}  />
                    <FormInput2 
                        type={"password"} 
                        label={"Password (again)"} 
                        placeholder={"Re-enter your new password"}  
                        errorMsg={""}
                        isDisabled={isLoading} 
                        checker={(val) => [val === correctPassword, "Passwords do not match"]} 
                        setCorrectValue={setCorrectReenteredPassword}  />
                    <button
                        type="submit"
                        disabled={!canSubmit || isLoading}
                        class="w-full bg-yellow-50 text-blue-50 h-10 py-2 px-4 text-center rounded disabled:opacity-50 hover:bg-yellow-500" >
                        {isLoading ? (
                        <AiOutlineLoading className={`animate-spin`} />
                        ) : (
                          "Change Password"
                        )}
                    </button>
                    </div>
                  </TabbedView>
              </DashboardPanel.Body>
            </DashboardPanel>
          <DashboardPanel restrictedHeight={false} collapsable={false}>
              <DashboardPanel.Header>
                Delete Your Account
              </DashboardPanel.Header>
              <DashboardPanel.Body>
                <div>Your account will be deleted permanently.</div>
                <div>
                <button className="bg-yellow-50 text-blue-50 py-2 px-4 my-5 rounded" onClick={delete_user}>
                  Delete Account
                </button>
                </div>
              </DashboardPanel.Body>
            </DashboardPanel>
          </MenuPages>
        </div>
      </div>
    </div>
  );
}
