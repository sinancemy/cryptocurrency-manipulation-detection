import { DashboardPanel } from "../../components/DashboardPanel"
import { useRequireLogin, useUser } from "../../user-hook"
import { FollowOverview } from "../../components/FollowOverview"
import { TabbedView } from "../../components/TabbedView"
import { SimpleMenu } from "../../components/SimpleMenu"
import { useMemo, useState } from "react"
import { MenuPages } from "../../components/MenuPages"

export default function Profile() {
  useRequireLogin()
  const { username, followedCoins, followedSources, areCoinNotificationsOn, areSourceNotificationsOn } = useUser()
  const followedGroups = useMemo(() => followedSources.filter(f => f.target.startsWith("*@")), [followedSources])
  const followedUsers = useMemo(() => followedSources.filter(f => !f.target.startsWith("*@")), [followedSources])

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
                Nothing yet.
              </DashboardPanel.Body>
            </DashboardPanel>
          <DashboardPanel restrictedHeight={false} collapsable={false}>
              <DashboardPanel.Header>
                Delete Your Account
              </DashboardPanel.Header>
              <DashboardPanel.Body>
                Nothing yet.
              </DashboardPanel.Body>
            </DashboardPanel>
          </MenuPages>
        </div>
      </div>
    </div>
  );
}
