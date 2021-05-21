import { DashboardPanel } from "../../components/DashboardPanel"
import { useRequireLogin, useUser } from "../../user-hook"
import { FollowOverview } from "../../components/FollowOverview"
import { TabbedView } from "../../components/TabbedView"
import { SimpleMenu } from "../../components/SimpleMenu"
import { useCallback, useMemo, useState } from "react"
import { MenuPages } from "../../components/MenuPages"
import { FormInput2 } from "../../components/FormInput2";

export default function Profile() {
  useRequireLogin()
  const { username, email, followedCoins, followedSources, delete_user, updateUser, change_email, change_password } = useUser()
  const followedGroups = useMemo(() => followedSources.filter(f => f.target.startsWith("*@")), [followedSources])
  const followedUsers = useMemo(() => followedSources.filter(f => !f.target.startsWith("*@")), [followedSources])
  const [oldPassword, setOldPassword] = useState(null)
  const [correctPassword, setCorrectPassword] = useState(null)
  const [correctReenteredPassword, setCorrectReenteredPassword] = useState(null)
  const [isLoading, setLoading] = useState(false);
  const [correctEmail, setCorrectEmail] = useState(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("");
  const [successMsg1, setSuccessMsg1] = useState("");
  const [errorMsg1, setErrorMsg1] = useState("")

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

  const canSubmit1 = useMemo(() => correctPassword && correctEmail, 
  [correctPassword, correctEmail])

  const [selectedPage, setSelectedPage] = useState(0)

  const onSubmit = useCallback((e) => {
    e.preventDefault()
    change_password(oldPassword, correctPassword, (ok) => {
      setSuccessMsg1("Password changed.")
    }, (err) => {
      setErrorMsg1("You have entered your current password wrong.")
    })
  }, [canSubmit, correctPassword, oldPassword])

  const onSubmit1 = useCallback((e) => {
    e.preventDefault()
    change_email(correctPassword, correctEmail, (ok) => {
      setSuccessMsg("Email changed.")
    }, (err) => {
      setErrorMsg("Email cannot be changed.")
    })
  }, [canSubmit1, correctPassword, correctEmail])

  return (
    <div className="animate-fade-in-down">
      <div className="flex flex-row pt-2 space-x-2 justify-center">
        <div>
          <DashboardPanel collapsable={false}>
            <DashboardPanel.Header>
            </DashboardPanel.Header>
            <DashboardPanel.Body>
              <div className={"flex flex-col items-center space-y-2"}>
                <img style={{"border-radius": "50%"}}
                     width={64} height={64}
                     src={"https://kstu.edu.tr/kstu-file/uploads/default-user-image.png"}
                />
                <div>
                  { username }
                </div>
              </div>
            </DashboardPanel.Body>
          </DashboardPanel>
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
                  <form onSubmit={onSubmit1}>
                  {successMsg !== "" ? (
              <div
                class="animate-fade-in-down bg-green-100 border border-green-400 text-sm text-green-700 px-4 py-3 mb-3 rounded relative"
                role="alert">
                {successMsg}
              </div>
            ) : null}
            {errorMsg !== "" ? (
              <div
                class="animate-fade-in-down bg-red-100 border border-red-400 text-sm text-red-700 px-4 py-3 mb-3 rounded relative"
                role="alert">
                {errorMsg}
              </div>
            ) : null}
                  <div className="block text-700 text-md font-bold mb-2">Your email: {email} </div>
                    <FormInput2 type={"text"} 
                      label={"Enter New E-mail"} 
                      placeholder={"New e-mail"} 
                      errorMsg={""}
                      isDisabled={isLoading} 
                      checker={emailChecker} 
                      setCorrectValue={setCorrectEmail}  />
                      <FormInput2 type={"password"} 
                      label={"Enter Password"} 
                      placeholder={"Your password"} 
                      errorMsg={""}
                      isDisabled={isLoading} 
                      checker={simpleFieldChecker} 
                      setCorrectValue={setCorrectPassword}  />
                    <button
                        type="submit"
                        disabled={!canSubmit1 || isLoading}
                        class="w-full bg-yellow-50 text-blue-50 h-10 py-2 px-4 text-center rounded disabled:opacity-50 hover:bg-yellow-500" >
                        {isLoading ? (
                        <AiOutlineLoading className={`animate-spin`} />
                        ) : (
                          "Change Email"
                        )}
                    </button>
                    </form>
                    </div>
                    <div>
                    <form onSubmit={onSubmit}>
                    {successMsg1 !== "" ? (
              <div
                class="animate-fade-in-down bg-green-100 border border-green-400 text-sm text-green-700 px-4 py-3 mb-3 rounded relative"
                role="alert">
                {successMsg1}
              </div>
            ) : null}
            {errorMsg1 !== "" ? (
              <div
                class="animate-fade-in-down bg-red-100 border border-red-400 text-sm text-red-700 px-4 py-3 mb-3 rounded relative"
                role="alert">
                {errorMsg1}
              </div>
            ) : null}
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
                        class="w-full bg-yellow-50 text-blue-50 h-10 py-2 px-4 text-center rounded disabled:opacity-50 hover:bg-yellow-500">
                        {isLoading ? (
                        <AiOutlineLoading className={`animate-spin`} />
                        ) : (
                          "Change Password"
                        )}
                    </button>
                    </form>
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
