import axios from "axios";
import { useState } from "react";
import { useCookies } from "react-cookie";

export default function Login() {

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const [cookie, setCookie] = useCookies(["user"])

  const submitLogin = async (e) => {
    var signupFormData = new FormData()
    signupFormData.append("username", username)
    signupFormData.append("password", password)
    const res = await axios.post("//127.0.0.1:5000/user/login", signupFormData, { withCredentials: true })
    .then(r => {
      if(r.data.result === "error") {
        setErrorMsg(r.data.error_msg)
        return
      }
      console.log(r.headers.cookie)
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-10 xs:p-0 mx-auto md:w-full md:max-w-md">
        <div className="w-full rounded-lg divide-y border-2 border-yellow-50 rounded-2xl drop-shadow-2xl bg-opacity-20 bg-blue-50">
          <div className="px-5 py-7">
            <h1 className="font-bold text-yellow-50 text-center text-2xl mb-5">
              Welcome Back!
            </h1>
            { (errorMsg !== '') ? 
              <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-3 rounded relative" role="alert">
                <strong class="font-bold">{errorMsg}</strong>
              </div>
            : null}
              <label className="font-semibold text-sm text-white pb-1 block">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.currentTarget.value)}
                class="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full"
              />
              <label class="font-semibold text-sm text-white pb-1 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.currentTarget.value)}
                class="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full"
              />
              <button
                type="submit"
                onClick={submitLogin}
                class="bg-yellow-50 text-blue-50 w-full py-2.5 rounded-lg text-sm shadow-sm font-semibold text-center inline-block"
              >
                <span class="inline-block mr-2">Log In</span>
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}
