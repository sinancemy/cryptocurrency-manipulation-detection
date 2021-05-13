import { useCallback, useMemo, useState } from "react";
import { useRequireGuest, useUser } from "../../user-hook"
import { FormInput } from "../../components/FormInput";
import { AiOutlineLoading } from "react-icons/ai";

export default function Login() {
  useRequireGuest()
  const { login } = useUser()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [usernameErrorMsg, setUsernameErrorMsg] = useState("")
  const [passwordErrorMsg, setPasswordErrorMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [isLoading, setLoading] = useState(false)
  const canSubmit = useMemo(() => username !== "" && password !== "", [username, password])

  const onSubmit = useCallback((e) => {
    e.preventDefault()
    if(!canSubmit) return
    setLoading(true)
    login(username, password, (err) => {
      setLoading(false)
      if(err.error_type === 0) setErrorMsg(err.error_msg)
      if(err.error_type === 1) setUsernameErrorMsg(err.error_msg)
      if(err.error_type === 2) setPasswordErrorMsg(err.error_msg)
    })
  }, [canSubmit, username, password])

  return (
    <div className="min-h-screen flex flex-col animate-fade-in-down">
      <div className="p-5 md:p-0 mx-auto md:w-full md:max-w-md">
        <div className="px-5 py-7">
          <div className="rounded-t-lg bg-white py-5 px-5 shadow-lg">
              <h1 className="font-bold text-center text-2xl">
                Welcome back!
              </h1>
          </div>
          <form class="bg-gray-50 rounded-b-lg border-t border-b border-gray-200 pt-6 px-6 shadow-lg" onSubmit={onSubmit}>
          { (errorMsg !== '') && 
            <div class="animate-fade-in-down bg-red-100 border border-red-400 text-sm text-red-700 px-4 py-3 mb-3 rounded relative" role="alert">
              {errorMsg}
            </div> }
            <div class="pb-8">
              <div class="mb-4">
                <FormInput 
                  label={"Username"}
                  placeholder={"Your username"}
                  type={"text"}
                  errorMsg={usernameErrorMsg}
                  isDisabled={isLoading}
                  setCorrectValue={setUsername} />
              </div>
              <div class="mb-4">
                <FormInput 
                  label={"Password"}
                  placeholder={"Your password"}
                  type={"password"}
                  errorMsg={passwordErrorMsg}
                  isDisabled={isLoading}
                  setCorrectValue={setPassword} />
              </div>
              <div className="grid grid-cols-2">
                <button 
                  type="submit" 
                  disabled={!canSubmit || isLoading}
                  class="bg-yellow-50 text-blue-50 h-10 py-2 text-center px-4 w-36 rounded disabled:opacity-50 hover:bg-yellow-500">
                {isLoading ? 
                  <AiOutlineLoading className={`animate-spin`} />
                : 'Log in'}
                </button>
                <a class="link inline-block text-right font-bold text-sm text-blue hover:text-blue-darker" href="forgot-password">
                  Forgot Password?
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}