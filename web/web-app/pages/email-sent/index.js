import { useRequireGuest, useUser } from "../../user-hook"

export default function EmailSent() {
  useRequireGuest()

  return (
    <div className="min-h-screen flex flex-col animate-fade-in-down">
      <div className="p-5 md:p-0 mx-auto md:w-full md:max-w-md">
        <div className="px-5 py-7">
          <div className="rounded-t-lg bg-white py-5 px-5 shadow-lg">
              <h1 className="font-bold text-center text-2xl">
                Password reset request is sent to your email.
              </h1>
          </div>
          <form class="bg-white rounded-b-lg px-6 shadow-lg">
            <div class="pb-8">
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}