import axios from "axios";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { FormInput } from "../../components/FormInput";
import { useRequireGuest, useUser } from "../../user-hook";

export default function Signup() {
  useRequireGuest()

  const router = useRouter()
  const { register, login } = useUser()
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [correctUsername, setCorrectUsername] = useState(null)
  const [correctPassword, setCorrectPassword] = useState(null)
  const [correctReenteredPassword, setCorrectReenteredPassword] = useState(null)
  const [correctEmail, setCorrectEmail] = useState(null)

  const [errorMsg, setErrorMsg] = useState("")
  const [usernameErrorMsg, setUsernameErrorMsg] = useState("");
  const [emailErrorMsg, setEmailErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setLoading] = useState(false);

  // Username field checker.
  const simpleFieldChecker = useCallback((val) => {
    if (val === "") {
      return [false, "This field is required."]
    } else if (val.length < 5) {
      return [false, "Too short."]
    }
    return [true, null]
  }, [])

  const emailChecker = useCallback((val) => {
    const re = /^\S+@\S+$/
    const valid = re.test(val.toLowerCase())
    return [valid, "Invalid e-mail."]
  }, [])

  const canSubmit = useMemo(() => correctUsername && correctPassword && correctReenteredPassword && correctEmail && termsAgreed, 
  [correctUsername, correctPassword, correctReenteredPassword, correctEmail, termsAgreed])

  const onSubmit = useCallback((e) => {
    e.preventDefault()
    if(!canSubmit) return
    setLoading(true)
    register(correctUsername, correctPassword, correctEmail, (ok) => {
      login(correctUsername, correctPassword)
    }, (err) => {
      setLoading(false)
      if(err.error_type === 0) setErrorMsg(err.error_msg)
      if(err.error_type === 1) setUsernameErrorMsg(err.error_msg)
      if(err.error_type === 2) setEmailErrorMsg(err.error_msg)
    })
  }, [canSubmit, correctUsername, correctPassword, correctEmail])


  return (
    <div className="min-h-screen flex flex-col animate-fade-in-down">
      <div className="p-5 md:p-0 mx-auto md:w-full md:max-w-md">
        <div className="px-5 py-7">
          <div className="rounded-t-lg bg-white py-5 px-5 shadow-lg">
            <h1 className="font-bold text-center text-2xl">New here?</h1>
          </div>
          <form
            class="bg-gray-50 rounded-b-lg border-t border-b border-gray-200 pt-6 px-6 shadow-lg"
            onSubmit={onSubmit}>
            {successMsg !== "" ? (
              <div
                class="animate-fade-in-down bg-green-100 border border-green-400 text-sm text-green-700 px-4 py-3 mb-3 rounded relative"
                role="alert">
                {successMsg}
              </div>
            ) : null}
            {errorMsg !== "" ? (
              <div
                class="animate-fade-in-down bg-red-100 border border-red-400 text-sm text-red-700 px-4 py-3 mb-3 rounded relative"
                role="alert">
                {errorMsg}
              </div>
            ) : null}
            <div class="flex flex-col space-y-2 pb-8">
              <FormInput 
                type={"text"} 
                label={"Username"} 
                placeholder={"Your username"} 
                errorMsg={usernameErrorMsg} 
                isDisabled={isLoading} 
                checker={simpleFieldChecker} 
                setCorrectValue={setCorrectUsername}  />
              <FormInput type={"password"} 
                label={"Password"} 
                placeholder={"Your password"} 
                errorMsg={""}
                isDisabled={isLoading} 
                checker={simpleFieldChecker} 
                setCorrectValue={setCorrectPassword}  />
              <FormInput 
                type={"password"} 
                label={"Password (again)"} 
                placeholder={"Re-enter your password"}  
                errorMsg={""}
                isDisabled={isLoading} 
                checker={(val) => [val === correctPassword, "Passwords do not match"]} 
                setCorrectValue={setCorrectReenteredPassword}  />
              <FormInput 
                type={"text"} 
                label={"E-mail"} 
                placeholder={"Your e-mail"} 
                errorMsg={emailErrorMsg}
                isDisabled={isLoading} 
                checker={emailChecker}
                setCorrectValue={setCorrectEmail}  />
              <div class="mb-4">
                <label class="block text-gray-700 text-sm mb-2">
                  <input
                    type="checkbox"
                    disabled={isLoading}
                    checked={termsAgreed}
                    className="mr-2"
                    onChange={(e) => setTermsAgreed(e.currentTarget.checked)} />
                  I agree with the{" "}
                  <a href="#" className="link">
                    terms and conditions
                  </a>
                  .
                </label>
              </div>
              <button
                type="submit"
                disabled={!canSubmit || isLoading}
                class="w-full bg-yellow-50 text-blue-50 h-10 py-2 px-4 text-center rounded disabled:opacity-50 hover:bg-yellow-500" >
                {isLoading ? (
                  <AiOutlineLoading className={`animate-spin`} />
                ) : (
                  "Sign up"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
