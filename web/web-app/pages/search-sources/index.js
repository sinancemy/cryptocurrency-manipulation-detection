import axios from "axios";
import cookie from "cookie";
import Router from "next/router";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Field, Formik, Form } from "formik";

export async function getServerSideProps(context) {
  if (context.req.headers.cookie == null) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
  const res = await axios.get("http://127.0.0.1:5000/api/source_list");

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

  var reddit_source = res.data
    .filter((source) => source.source.includes("reddit"))
    .sort((a, b) => a.source.localeCompare(b.source));

  let users = [];

  await Promise.all(
    reddit_source.map(async (source) => {
      let reddit_users = new Set();
      const res3 = await axios.get(
        "http://127.0.0.1:5000/api/posts?source=" + source.source
      );
      res3.data.forEach((entry) => {
        reddit_users.add(entry.user);
      });
      reddit_users = Array.from(reddit_users).sort();
      reddit_users.unshift("Follow All Sources");
      users.push([source.source, reddit_users]);
    })
  );

  let twitter_users = [];
  res.data
    .filter((source) => source.source.includes("twitter"))
    .forEach((source) => twitter_users.push(source.username));

  twitter_users.sort();
  twitter_users.unshift("Follow All Sources");
  users = users.sort((a, b) => a[0].localeCompare(b[0]));
  users.unshift(["twitter", twitter_users]);

  return {
    props: {
      users: users,
      userInfo: userinfo,
    },
  };
}

export default function SearchSources({ users, userInfo, token }) {
  const router = useRouter();
  if (userInfo === null) {
    useEffect(() => {
      router.push("/");
    });
  }

  const [query, setQuery] = useState("");
  const filterUsers = (users, query) => {
    if (!query) {
      return users;
    }
    return users.filter((coin) => {});
  };

  const sourceNameArray = [];
  userInfo.followed_sources.forEach((source) => {
    sourceNameArray.push(source.source);
  });
  const initialNameArray = [...sourceNameArray];

  const submitForm = async (values) => {
    console.log(userInfo.followed_sources);
    console.log(users);
    let unfollowed = initialNameArray.filter(
      (x) => !values.checked.includes(x)
    );
    let followed = values.checked.filter((x) => !initialNameArray.includes(x));

    await Promise.all(
      followed.map(async (name) => {
        await axios.get(
          "http://127.0.0.1:5000/user/follow_source?token=" +
            token +
            "&source=" +
            name +
            "&unfollow=0"
        );
      })
    );

    await Promise.all(
      unfollowed.map(async (name) => {
        await axios.get(
          "http://127.0.0.1:5000/user/follow_source?token=" +
            token +
            "&source=" +
            name +
            "&unfollow=1"
        );
      })
    );

    Router.reload();
  };

  return (
    <div className="animate-fade-in-down">
      <div className="grid grid-cols-3 mt-8">
        <div className="col-start-2 bg-white border-b rounded-t-lg">
          <h1 className="font-bold text-center text-2xl mt-4 mb-4">
            Follow Sources
          </h1>
        </div>
        <div className="col-start-2 grid grid-cols-12 bg-gray-50">
          <input
            className="col-start-2 col-end-12 mt-4 mb-4 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
            type="text"
            value={query}
            onInput={(e) => setQuery(e.target.value)}
            placeholder="Search"
          />
        </div>
        <div className="col-start-2 bg-gray-50 rounded-b-lg">
          <Formik
            initialValues={{ checked: sourceNameArray }}
            onSubmit={submitForm}
          >
            <Form>
              <ul className="max-h-96 overflow-y-auto">
                {users.map((entry, i) =>
                  entry[1].map((source, j) => (
                    <li
                      key={i.toString() + j.toString()}
                      className="grid grid-cols-12 py-1 px-4 rounded-md"
                    >
                      <div className="col-start-2 col-span-4 bg-gray-200">
                        <p
                          className={
                            source === "Follow All Sources"
                              ? "text-black ml-2 font-bold"
                              : "text-black ml-2"
                          }
                        >
                          {entry[0]}
                        </p>
                      </div>
                      <div className="col-start-6 bg-gray-200 col-span-5 flex items-center">
                        <p
                          className={
                            source === "Follow All Sources"
                              ? "text-black ml-2 font-bold"
                              : "text-black ml-2"
                          }
                        >
                          {source}
                        </p>
                      </div>
                      <div className="col-start-11 bg-gray-200 flex items-center">
                        <Field
                          className="h-6 w-6"
                          value={
                            source === "Follow All Sources"
                              ? "*@" + entry[0]
                              : source + "@" + entry[0]
                          }
                          name="checked"
                          type="checkbox"
                        />
                      </div>
                    </li>
                  ))
                )}
              </ul>
              <button
                className="col-start-2 w-full bg-yellow-50 text-blue-50 h-10 rounded-b-lg disabled:opacity-50 hover:bg-yellow-500"
                type="submit"
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
