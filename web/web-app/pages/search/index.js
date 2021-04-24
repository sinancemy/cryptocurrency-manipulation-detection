import axios from "axios";
import cookie from "cookie";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useFormik, Field, Formik, Form } from "formik";

export async function getServerSideProps(context) {
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

export default function Search({ coins, userInfo, token }) {
  const router = useRouter();

  if (userInfo === null) {
    useEffect(() => {
      router.push("/");
    });
  }

  const coinNameArray = [];
  userInfo.followed_coins.forEach((coin) => {
    coinNameArray.push(coin.coin_type);
  });
  const initialNameArray = [...coinNameArray];

  const submitForm = (values) => {
    let unfollowed = initialNameArray.filter(
      (x) => !values.checked.includes(x)
    );
    let followed = values.checked.filter((x) => !initialNameArray.includes(x));
    followed.forEach((coin) => {
      submitRequest(coin, true);
    });

    unfollowed.forEach((coin) => {
      submitRequest(coin, false);
    });
  };

  const submitRequest = async (coin, bool) => {
    if (bool) {
      await axios.get(
        "//127.0.0.1:5000/user/follow_coin?token=" +
          token +
          "&type=" +
          coin +
          "&unfollow=0"
      );
    } else {
      await axios.get(
        "//127.0.0.1:5000/user/follow_coin?token=" +
          token +
          "&type=" +
          coin +
          "&unfollow=1"
      );
    }
  };

  return (
    <div className="animate-fade-in-down">
      <div className="grid grid-cols-3 gap-4 border mt-4">
        <h1 className="col-start-2 font-bold text-center text-2xl text-white">
          Follow Coins
        </h1>
        <div className="col-start-2 grid grid-cols-3 border">
          <input
            className="col-span-3 mt-4 ml-4 mr-4 mb-4"
            type="text"
            placeholder="Search"
          />
        </div>
        <div className="col-start-2">
          <Formik
            initialValues={{ checked: coinNameArray }}
            onSubmit={submitForm}
          >
            <Form>
              <div className="max-h-96 overflow-y-auto border">
                {coins.map((coin, index) => (
                  <div key={index} className="grid grid-cols-3 border">
                    <img
                      className="h-12 w-12 border"
                      src={coin.image}
                      alt="logo"
                    />
                    <p className="border text-white">{coin.name}</p>
                    <Field
                      value={coin.name}
                      name="checked"
                      className="border"
                      type="checkbox"
                    />
                  </div>
                ))}
              </div>
              <button
                type="submit"
                className="col-start-2 w-full bg-yellow-50 text-blue-50 h-10 py-2 px-4 rounded disabled:opacity-50 hover:bg-yellow-500"
              >
                Submit
              </button>
            </Form>
          </Formik>
        </div>
      </div>
    </div>
  );
}
