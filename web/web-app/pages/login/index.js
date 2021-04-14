export default function Login() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-10 xs:p-0 mx-auto md:w-full md:max-w-md">
        <div className="w-full rounded-lg divide-y border-2 border-yellow-50 rounded-2xl drop-shadow-2xl bg-opacity-20 bg-blue-50">
          <div className="px-5 py-7">
            <h1 className="font-bold text-yellow-50 text-center text-2xl mb-5">
              Welcome Back!
            </h1>
            <label className="font-semibold text-sm text-white pb-1 block">
              Username
            </label>
            <input
              type="text"
              class="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full"
            />
            <label class="font-semibold text-sm text-white pb-1 block">
              Password
            </label>
            <input
              type="password"
              class="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full"
            />
            <button
              type="button"
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
