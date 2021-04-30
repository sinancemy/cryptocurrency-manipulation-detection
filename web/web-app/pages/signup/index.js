import axios from "axios";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useRequireGuest } from "../../user-hook";

export default function Signup() {
  useRequireGuest()
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [reenteredPassword, setReenteredPassword] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [usernameErrorMsg, setUsernameErrorMsg] = useState("");
  const [passwordErrorMsg, setPasswordErrorMsg] = useState("");
  const [reenteredPasswordErrorMsg, setReenteredPasswordErrorMsg] = useState(
    ""
  );

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [canSubmit, setCanSubmit] = useState(false);
  const [isLoading, setLoading] = useState(false);

  const submitSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    var signUp = new FormData();
    signUp.append("username", username);
    signUp.append("password", password);
    const res = await axios.post("//127.0.0.1:5000/user/register", signUp);
    if (res.data.result === "error" && res.data.error_type === 1) {
      setUsernameErrorMsg(res.data.error_msg);
      setLoading(false);
      return;
    } else if (res.data.result === "error") {
      setLoading(false);
      setErrorMsg(res.data.error_msg);
    } else if (res.data.result == "ok") {
      setSuccessMsg("Success! You are being redirected...");
      await new Promise((res) => setTimeout(res, 2000));
      router.push("/login?username=" + username);
    }
  };

  // Username field checker.
  const usernameChecker = async () => {
    if (username === "") {
      setUsernameErrorMsg("Please choose a username.");
    } else if (username.length < 5) {
      setUsernameErrorMsg("Too short.");
    } else {
      // No problem.
      setUsernameErrorMsg("");
    }
  };

  // Password field checker.
  const passwordChecker = async () => {
    if (password === "") {
      setPasswordErrorMsg("Please choose a password.");
    } else if (password.length < 5) {
      setPasswordErrorMsg("Too short.");
    } else if (password === "12345") {
      setPasswordErrorMsg("Really? That's your password?!");
    } else {
      // No problem.
      setPasswordErrorMsg("");
    }
  };

  // Reentered password field checker.
  const reenteredPasswordChecker = async () => {
    if (reenteredPassword === "") {
      setReenteredPasswordErrorMsg("Please re-enter your password.");
    } else if (password !== reenteredPassword) {
      setReenteredPasswordErrorMsg("Passwords do not match.");
    } else {
      // No problem.
      setReenteredPasswordErrorMsg("");
    }
  };

  const usernameCheckerFirstUpdate = useRef(true);
  useEffect(() => {
    if (usernameCheckerFirstUpdate.current) {
      return;
    }
    usernameChecker();
  }, [username]);

  const passwordCheckerFirstUpdate = useRef(true);
  useEffect(() => {
    if (passwordCheckerFirstUpdate.current) {
      return;
    }
    passwordChecker();
  }, [password]);

  const reenteredPasswordCheckerFirstUpdate = useRef(true);
  useEffect(() => {
    if (reenteredPasswordCheckerFirstUpdate.current) {
      return;
    }
    reenteredPasswordChecker();
  }, [reenteredPassword, password]);

  // User can submit checker.
  useEffect(() => {
    const c =
      username !== "" &&
      password !== "" &&
      reenteredPassword !== "" &&
      termsAgreed &&
      usernameErrorMsg === "" &&
      passwordErrorMsg === "" &&
      reenteredPasswordErrorMsg === "";
    setCanSubmit(c);
  }, [
    usernameErrorMsg,
    passwordErrorMsg,
    reenteredPasswordErrorMsg,
    username,
    password,
    reenteredPassword,
    termsAgreed,
  ]);

  return (
    <div className="min-h-screen flex flex-col animate-fade-in-down">
      <div className="p-5 md:p-0 mx-auto md:w-full md:max-w-md">
        <div className="px-5 py-7">
          <div className="rounded-t-lg bg-white py-5 px-5 shadow-lg">
            <h1 className="font-bold text-center text-2xl">New here?</h1>
          </div>
          <form
            class="bg-gray-50 rounded-b-lg border-t border-b border-gray-200 pt-6 px-6 shadow-lg"
            onSubmit={submitSignup}
          >
            {successMsg !== "" ? (
              <div
                class="animate-fade-in-down bg-green-100 border border-green-400 text-sm text-green-700 px-4 py-3 mb-3 rounded relative"
                role="alert"
              >
                {successMsg}
              </div>
            ) : null}
            {errorMsg !== "" ? (
              <div
                class="animate-fade-in-down bg-red-100 border border-red-400 text-sm text-red-700 px-4 py-3 mb-3 rounded relative"
                role="alert"
              >
                {errorMsg}
              </div>
            ) : null}
            <div class="pb-8">
              <div class="mb-4">
                <label className="block text-gray-700 text-md font-bold mb-2">
                  Username
                  <input
                    type="text"
                    placeholder="Your username"
                    onFocus={() => (usernameCheckerFirstUpdate.current = false)}
                    disabled={isLoading}
                    value={username}
                    onChange={(e) => setUsername(e.currentTarget.value)}
                    className={`mt-1 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight
                        ${usernameErrorMsg !== "" ? "border-red-500" : null}`}
                  />
                </label>
                <p class="text-red-500 text-xs italic mt-2 ml-1">
                  {usernameErrorMsg}
                </p>
              </div>
              <div class="mb-4">
                <label class="block text-gray-700 text-md font-bold mb-2">
                  Password
                  <input
                    type="password"
                    placeholder="Your password"
                    onFocus={() => (passwordCheckerFirstUpdate.current = false)}
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                    className={`mt-1 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight
                        ${passwordErrorMsg !== "" ? "border-red-500" : null}`}
                  />
                </label>
                <p class="text-red-500 text-xs italic mt-2 ml-1">
                  {passwordErrorMsg}
                </p>
              </div>
              <div class="mb-4">
                <label class="block text-gray-700 text-md font-bold mb-2">
                  Password (again)
                  <input
                    type="password"
                    placeholder="Re-enter your password"
                    onFocus={() =>
                      (reenteredPasswordCheckerFirstUpdate.current = false)
                    }
                    disabled={isLoading}
                    value={reenteredPassword}
                    onChange={(e) =>
                      setReenteredPassword(e.currentTarget.value)
                    }
                    className={`mt-1 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight
                        ${
                          reenteredPasswordErrorMsg !== ""
                            ? "border-red-500"
                            : null
                        }`}
                  />
                </label>
                <p class="text-red-500 text-xs italic mt-2 ml-1">
                  {reenteredPasswordErrorMsg}
                </p>
              </div>
              <div class="mb-4">
                <label class="block text-gray-700 text-sm mb-2">
                  <input
                    type="checkbox"
                    disabled={isLoading}
                    checked={termsAgreed}
                    className="mr-2"
                    onChange={(e) => setTermsAgreed(e.currentTarget.checked)}
                  />
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
                class="w-full bg-yellow-50 text-blue-50 h-10 py-2 px-4 rounded disabled:opacity-50 hover:bg-yellow-500"
              >
                {isLoading ? (
                  <svg
                    class="animate-spin m-auto w-5 h-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
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
