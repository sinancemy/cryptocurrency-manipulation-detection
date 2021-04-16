import axios from "axios";
import { useState } from "react";
import { useCookies } from "react-cookie";
import { useRouter } from "next/router"

export default function Login() {

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const router = useRouter()

  const [cookie, setCookie] = useCookies()

  const submitLogin = async (e) => {
    setErrorMsg("")
    var signIn = new FormData()
    signIn.append("username", username)
    signIn.append("password", password)
    const res = axios.post("//127.0.0.1:5000/user/login", signIn)
    .then(r => {
      if(r.data.result === "error") {
        setErrorMsg(r.data.error_msg)
        return
      } else if(r.data.result == "ok") {
        setCookie("token", r.data.token)
        setSuccessMsg("Success. Redirecting...")
        router.push("/dashboard")
      }
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
            { (successMsg !== '') ? 
              <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 mb-3 rounded relative" role="alert">
                <strong class="font-bold">{successMsg}</strong>
              </div>
            : null}
            { (errorMsg !== '') ? 
              <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-3 rounded relative" role="alert">
                <strong class="font-bold">{errorMsg}</strong>
              </div>
            : null}
              { (successMsg === '') ?
              <div>
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
              : null }
          </div>
        </div>
      </div>
    </div>
  );
}
