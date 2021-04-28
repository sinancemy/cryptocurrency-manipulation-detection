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
      coins: res.data,
      userInfo: userinfo,
    },
  };
}

export default function SearchCoins({ coins, userInfo, token }) {
  const router = useRouter();
  if (userInfo === null) {
    useEffect(() => {
      router.push("/");
    });
  }

  const [query, setQuery] = useState("");
  const filterCoins = (coins, query) => {
    if (!query) {
      return coins;
    }
    return coins.filter((coin) => coin.name.toLowerCase().includes(query.toLowerCase()));
  };
  const filteredCoins = filterCoins(coins, query);
  const [followedCoins, setFollowedCoins] = useState([...userInfo.followed_coins.map(coin => coin.coin_type)])

  const toggleFollow = useCallback((coin) => {
    const alreadyFollowing = followedCoins.includes(coin)
    const unfollow = alreadyFollowing ? 1 : 0
    axios.get("http://127.0.0.1:5000/user/follow_coin?token=" + token 
                + "&type=" + coin 
                + "&unfollow=" + unfollow)
    .then(resp => {
      if(resp.data.result === "ok") {
        if(unfollow === 1) {
          setFollowedCoins(followedCoins.filter(c => c !== coin))
        } else {
          setFollowedCoins([...followedCoins, coin])
        }
      }
    })
  }, [followedCoins])

  const isFollowing = useCallback((coin) => {
    return followedCoins.includes(coin)
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
                          <CuteButton
                            onClick={() => toggleFollow(coin.name)}
                            textColor={ isFollowing(coin.name) ? "yellow-400" : "green-400" }
                            fullWidth={true}>
                            { isFollowing(coin.name) ? "Unfollow" : "Follow" }
                          </CuteButton>
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
