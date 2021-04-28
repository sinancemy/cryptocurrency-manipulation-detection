import axios from "axios";
import cookie from "cookie";
import Router from "next/router";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Field, Formik, Form } from "formik";
import { DashboardPanel } from "../../components/DashboardPanel";
import { CoinCard } from "../../components/CoinCard";
import { Card } from "../../components/Card";
import { getCoinColor, getCoinIcon } from "../../Helpers";

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
    return coins.filter((coin) => {
      const name = coin.name.toLowerCase();
      return name.includes(query.toLowerCase());
    });
  };
  const filteredCoins = filterCoins(coins, query);

  const coinNameArray = [];
  userInfo.followed_coins.forEach((coin) => {
    coinNameArray.push(coin.coin_type);
  });
  const initialNameArray = [...coinNameArray];

  const submitForm = async (values) => {
    let unfollowed = initialNameArray.filter(
      (x) => !values.checked.includes(x)
    );
    let followed = values.checked.filter((x) => !initialNameArray.includes(x));

    await Promise.all(
      followed.map(async (name) => {
        await axios.get(
          "http://127.0.0.1:5000/user/follow_coin?token=" +
            token +
            "&type=" +
            name +
            "&unfollow=0"
        );
      })
    );

    await Promise.all(
      unfollowed.map(async (name) => {
        await axios.get(
          "http://127.0.0.1:5000/user/follow_coin?token=" +
            token +
            "&type=" +
            name +
            "&unfollow=1"
        );
      })
    );

    Router.reload();
  };

  return (
    <div className="grid grid-cols-3 mt-8 animate-fade-in-down">
      <div className="col-start-2">
        <Formik initialValues={{ checked: coinNameArray }} onSubmit={submitForm}>
          <Form>
            <DashboardPanel collapsable={false}>
              <DashboardPanel.Header>
                <h1 className="font-bold text-center text-2xl mt-4 mb-4">
                  Follow Coins
                </h1>
                <div className="col-start-2 grid grid-cols-12">
                  <input
                    className="col-start-2 col-end-12 mt-4 mb-4 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                    type="text"
                    value={query}
                    onInput={(e) => setQuery(e.target.value)}
                    placeholder="Search"
                  />
                </div>
              </DashboardPanel.Header>
              <DashboardPanel.Body>
                  <ul>
                    {filteredCoins.map(coin => (
                      <div className="mb-2">
                        <Card 
                        isSelected={() => false}
                        badgeColor={getCoinColor(coin.name)}
                        icon={getCoinIcon(coin.name)}>
                          <Card.Title>
                            {coin.name}
                          </Card.Title>
                          <Card.Input>
                            <Field
                              className="h-6 w-6"
                              value={coin.name}
                              name="checked"
                              type="checkbox" />
                          </Card.Input>
                        </Card>
                      </div>
                    ))}
                  </ul>
              </DashboardPanel.Body>
              <DashboardPanel.Footer>
                <button
                  className="col-start-2 w-full bg-yellow-50 text-blue-50 h-10 rounded disabled:opacity-50 hover:bg-yellow-500"
                  type="submit">
                  Submit
                </button>
              </DashboardPanel.Footer>
            </DashboardPanel>
          </Form>
        </Formik>
      </div>
    </div>
  );
}
