import axios from "axios";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { useRouter } from "next/router"

export default function Login() {

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const [usernameErrorMsg, setUsernameErrorMsg] = useState("")
  const [passwordErrorMsg, setPasswordErrorMsg] = useState("")

  const [canSubmit, setCanSubmit] = useState(false)
  const [isLoading, setLoading] = useState(false)

  const router = useRouter()
  const [cookie, setCookie] = useCookies()

  const submitLogin = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    setLoading(true)
    var signIn = new FormData()
    signIn.append("username", username)
    signIn.append("password", password)
    const res = await axios.post("//127.0.0.1:5000/user/login", signIn)
    if(res.data.result === "error" && res.data.error_type === 1) {
      setLoading(false)
      setUsernameErrorMsg(res.data.error_msg)
    } else if(res.data.result === "error" && res.data.error_type === 2) {
      setLoading(false)
      setPasswordErrorMsg(res.data.error_msg)
    } else if(res.data.result === "error") {
      setLoading(false)
      setErrorMsg(res.data.error_msg)
    } else if(res.data.result == "ok") {
      setCookie("token", res.data.token)
      setSuccessMsg("Success. Redirecting...")
      router.push("/dashboard")
    }
  }

  // User can submit checker.
  useEffect(() => {
    const c = (username !== "" && password !== "" && errorMsg === "" 
                && usernameErrorMsg === "" && passwordErrorMsg === "")
    setCanSubmit(c)
  }, [username, password, errorMsg, usernameErrorMsg, passwordErrorMsg])

  // Reset the error message.
  useEffect(() => {
    setErrorMsg("")
    setUsernameErrorMsg("")
    setPasswordErrorMsg("")
  }, [username, password])

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-10 xs:p-0 mx-auto md:w-full md:max-w-md">
        <div className="w-full rounded-lg divide-y rounded drop-shadow-2xl bg-opacity-20 bg-blue-50">
          <div className="px-5 py-7">
            <h1 className="font-bold text-yellow-50 text-center text-2xl mb-5">
              Welcome back!
            </h1>
            <form class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={submitLogin}>
            { (successMsg !== '') ? 
              <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 mb-3 rounded relative" role="alert">
                {successMsg}
              </div>
            : null}
            { (errorMsg !== '') ? 
              <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-3 rounded relative" role="alert">
                {errorMsg}
              </div>
            : null}
              <div class="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Username
                  <input
                    type="text"
                    disabled={isLoading}
                    value={username}
                    onChange={e => setUsername(e.currentTarget.value)}
                    className={`mt-1 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight
                          ${ usernameErrorMsg !== '' ? 'border-red-500' : null}`}
                  />
                </label>
                <p class="text-red-500 text-xs italic mt-2 ml-1">{usernameErrorMsg}</p>
              </div>
              <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2">
                  Password
                  <input
                    type="password"
                    disabled={isLoading}
                    value={password}
                    onChange={e => setPassword(e.currentTarget.value)}
                    className={`mt-1 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight
                          ${ passwordErrorMsg !== '' ? 'border-red-500' : null}`}
                  />
                </label>
                <p class="text-red-500 text-xs italic mt-2 ml-1">{passwordErrorMsg}</p>
              </div>
              <button 
                type="submit" 
                disabled={!canSubmit || isLoading}
                class="bg-yellow-50 text-blue-50 w-full py-2.5 rounded-lg text-sm shadow-sm font-semibold text-center inline-block disabled:opacity-50 hover:bg-yellow-500">
              {isLoading ? <svg class="animate-spin m-auto h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg> : 'Log in'}
            </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
