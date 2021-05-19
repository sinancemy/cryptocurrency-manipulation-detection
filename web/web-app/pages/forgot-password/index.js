import axios from "axios";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { FormInput } from "../../components/FormInput";
import { useUser} from "../../user-hook";
import Link from "next/link"

export default function ForgotPassword() {
  //useRequireGuest()

  const router = useRouter()
  const { send_mail } = useUser()
  const [correctEmail, setCorrectEmail] = useState(null)
  const [emailErrorMsg, setEmailErrorMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setLoading] = useState(false);

  // Username field checker.
  const emailChecker = useCallback((val) => {
    const re = /^\S+@\S+$/
    const valid = re.test(val.toLowerCase())
    return [valid, "Invalid e-mail."]
  }, [])

  const canSubmit = useMemo(() => correctEmail, 
  [correctEmail])
  
  const onSubmit = useCallback((e) => {
    e.preventDefault()
    send_mail(correctEmail, (ok) => {
      setSuccessMsg("Password reset request is sent to your email.")
    }, (err) => {
      setErrorMsg("Email cannot be sent.")
    })
  }, [canSubmit, correctEmail])

  return (
    <div className="min-h-screen flex flex-col animate-fade-in-down">
      <div className="p-5 md:p-0 mx-auto md:w-full md:max-w-md">
        <div className="px-5 py-7">
          <div className="rounded-t-lg bg-white py-5 px-5 shadow-lg">
            <h1 className="font-bold text-center text-2xl">Forgot Password?</h1>
          </div>
          <form
            class="bg-gray-50 rounded-b-lg border-t border-b border-gray-200 pt-6 px-6 shadow-lg">
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
                label={"Enter E-mail"} 
                placeholder={"Your e-mail"} 
                errorMsg={emailErrorMsg}
                isDisabled={isLoading} 
                checker={emailChecker}
                setCorrectValue={setCorrectEmail}  />
                <Link href="email-sent">
              <button
                type="submit"
                disabled={!canSubmit || isLoading}
                onClick={onSubmit}
                class="w-full bg-yellow-50 text-blue-50 h-10 py-2 px-4 text-center rounded disabled:opacity-50 hover:bg-yellow-500" >
                {isLoading ? (
                  <AiOutlineLoading className={`animate-spin`} />
                ) : (
                  "Reset Password"
                )}
              </button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
