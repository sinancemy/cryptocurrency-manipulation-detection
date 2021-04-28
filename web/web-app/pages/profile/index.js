import axios from "axios"
import cookie from "cookie"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { DashboardPanel } from "../../components/DashboardPanel"
import { CoinCard } from "../../components/CoinCard"
import Link from "next/link"
import { CuteButton } from "../../components/CuteButton"
import { IoMdSettings } from "react-icons/io"
import { SourceCard } from "../../components/SourceCard"

export async function getServerSideProps(context) {
  const cookies = cookie.parse(context.req.headers.cookie)
  const res = await axios.get("http://127.0.0.1:5000/user/info", {
    params: {
      token: cookies.token
    }
  })
  if(res.data.result !== "ok") {
    return {
      redirect: {
        destination: '/login'
      }
    }
  }
  const userinfo = res.data.userinfo
  return {
    props: {
      userInfo: userinfo
    }
  }
}

export default function Profile({ userInfo, token }) {

  return (
    <div className="animate-fade-in-down">
      <div className="text-yellow-50 bg-gray-900 mt-4 border-t border-b border-yellow-50">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img className="h-24 w-24" alt="profile picture" />
              <span className="text-xl ml-4">{userInfo?.user?.username}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-10 lg:grid grid-cols-4 gap-4">
      <div className="col-start-2 col-end-3">
        <DashboardPanel>
          <DashboardPanel.Header>
             Coins That You Follow
          </DashboardPanel.Header>
          <DashboardPanel.Body>
            {userInfo && userInfo.followed_coins.length > 0 ? 
            userInfo?.followed_coins.map(coin => (
              <div className="mt-2">
                <CoinCard 
                  coin={coin.coin_type}
                  isSelected={() => 1+1}
                  onToggle={() => 1+1} />
              </div>
              )) : ("Not following any coins.")}
          </DashboardPanel.Body>
          <DashboardPanel.Footer>
            <div className="flex flex-row">
                <span className="flex-grow"></span>
                <Link href="/search-coins">
                <CuteButton>
                  <IoMdSettings />
                </CuteButton>
              </Link>
             </div>
          </DashboardPanel.Footer>
        </DashboardPanel>
        </div>

        <div className="col-start-3 col-end-4">
        <DashboardPanel>
          <DashboardPanel.Header>
             Sources That You Follow
          </DashboardPanel.Header>
          <DashboardPanel.Body>
          {userInfo && userInfo.followed_sources.length > 0 ? (
              userInfo.followed_sources.map(source => (
                <div className="mt-2">
                  <SourceCard 
                    source={source.source}
                    isSelected={() => 1+1}
                    onToggle={() => {1+1}} />
                </div>
              ))
            ) : ("Not following any sources.")}
          </DashboardPanel.Body>
          <DashboardPanel.Footer>
            <div className="flex flex-row">
                <span className="flex-grow"></span>
                <Link href="/search-coins">
                <CuteButton>
                  <IoMdSettings />
                </CuteButton>
              </Link>
             </div>
          </DashboardPanel.Footer>
        </DashboardPanel>
        </div>
      </div>
    </div>
  );
}
