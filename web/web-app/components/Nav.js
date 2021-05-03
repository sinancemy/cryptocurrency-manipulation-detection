import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useUser } from "../user-hook";
import { Notifier } from "./Notifier";

export default function Nav() {
  const { user, logout } = useUser()
  const loggedIn = useMemo(() => user?.user?.username !== "guest", [user])

  return (
    <div className="py-4 px-8 bg-blue-50 h-16 text text-white flex justify-between">
      <div className="flex text-xl items-center text-yellow-50">
        <Link href="/">Logo</Link>
      </div>
      {loggedIn ? (
        <div className="flex items-center">
          <div className="ml-8">
            <Link href="/dashboard">Dashboard</Link>
          </div>
          <div className="ml-8">
            <Link href="/search-coins">Search Coins</Link>
          </div>
          <div className="ml-8">
            <Link href="/search-sources">Search Sources</Link>
          </div>
          <div className="ml-8">
            <Link href="/profile">Profile</Link>
          </div>
          <div className="ml-8">
            <Notifier />
          </div>
          <button
            onClick={logout}
            className="ml-8 bg-yellow-50 text-blue-50 py-2 px-4 rounded">
            Logout
          </button>
        </div>
      ) : (
        <div className="flex items-center">
          <div className="ml-8">
            <Link href="/">Home</Link>
          </div>
          <div className="ml-8">
            <Link href="/login">Log In</Link>
          </div>
          <button className="ml-8 bg-yellow-50 text-blue-50 py-2 px-4 rounded">
            <Link href="/signup">Sign Up</Link>
          </button>
        </div>
      )}
    </div>
  );
}
