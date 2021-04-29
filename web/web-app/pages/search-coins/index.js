import axios from "axios";
import cookie from "cookie";
import Router from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Field, Formik, Form } from "formik";
import { DashboardPanel } from "../../components/DashboardPanel";
import { CoinCard } from "../../components/CoinCard";
import { Card } from "../../components/Card";
import { getCoinColor, getCoinIcon } from "../../Helpers";
import { CoinOverview } from "../../components/CoinOverview";
import { CuteButton } from "../../components/CuteButton";
import { FollowButton } from "../../components/FollowButton";

export async function getServerSideProps(context) {
  if (context.req.headers.cookie == null) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
  const res = await axios.get("http://127.0.0.1:5000/api/coin_list");

  const cookies = cookie.parse(context.req.headers.cookie);
  const res2 = await axios.get("http://127.0.0.1:5000/user/info", {
    params: {
      token: cookies.token,
    },
  });
  var userinfo = null;
  if (res2.data.result === "ok") {
    userinfo = res2.data.userinfo;
  } else {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
  return {
    props: {
      allCoins: res.data,
      userInfo: userinfo,
    },
  };
}

export default function SearchCoins({ allCoins, userInfo, token }) {
  const router = useRouter();
  if (userInfo === null) {
    useEffect(() => {
      router.push("/");
    });
  }
  const [query, setQuery] = useState("");
  const [coins, setCoins] = useState(allCoins)
  const [filteredCoins, setFilteredCoins] = useState([]);
  const [followedCoins, setFollowedCoins] = useState(new Set(userInfo.followed_coins.map(coin => coin.coin_type)))

  useEffect(() => {
    if (!query || query.trim() === "") {
      const rearranged = [...coins.filter(c => isFollowing(c.name)), ...coins.filter(c => !followedCoins.has(c.name))]
      setFilteredCoins(rearranged)
      return
    }
    const filtered = coins.filter((coin) => coin.name.toLowerCase().includes(query.toLowerCase()))
    setFilteredCoins(filtered)
  }, [coins, query, followedCoins])

  const isFollowing = useCallback((coinName) => {
    return followedCoins.has(coinName)
  }, [followedCoins])

  return (
    <div className="grid grid-cols-3 mt-3 animate-fade-in-down">
      <div className="col-start-2">
            <DashboardPanel collapsable={false} restrictedHeight={true} headerDivisior={true}>
              <DashboardPanel.Header>
                <h1 className="font-bold text-center text-2xl mt-4 mb-4">
                  Search Coins
                </h1>
                <div className="col-start-2 grid grid-cols-12">
                  <input
                    className="col-start-2 col-end-12 mt-4 mb-4 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                    type="text"
                    value={query}
                    onInput={(e) => setQuery(e.target.value)}
                    placeholder="Type to search..."
                  />
                </div>
              </DashboardPanel.Header>
              <DashboardPanel.Body>
                <div className="pt-2">
                  {filteredCoins.map(coin => (
                    <div className="mb-2">
                      <CoinOverview 
                        isSelected={() => true}
                        setSelected={() => true}
                        coin={coin.name}
                        button={(
                          <FollowButton
                            queryUrl={"http://127.0.0.1:5000/user/follow_coin"}
                            queryParams={{token: token, type: coin.name}}
                            isFollowing={() => isFollowing(coin.name)}
                            onFollow={() => setFollowedCoins(new Set([...followedCoins, coin.name]))}
                            onUnfollow={() => setFollowedCoins(new Set([...followedCoins].filter(c => c !== coin.name)))}/>
                        )}/>
                    </div>
                  ))}
                </div>
              </DashboardPanel.Body>
            </DashboardPanel>
      </div>
    </div>
  );
}
