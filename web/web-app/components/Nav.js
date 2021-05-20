import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useUser } from "../user-hook";
import { Notifier } from "./Notifier";
import { SearchBar } from "./SearchBar/SearchBar";
import { FiSettings } from "react-icons/fi";
import { FaUserCog } from "react-icons/fa";
import { CuteButton } from "./CuteButton";
import { IoPulseSharp } from "react-icons/io5";
import { IoMdPulse } from "react-icons/io";
import { RiHeartPulseFill } from "react-icons/ri";

export default function Nav() {
  const { loggedIn, logout, username } = useUser()

  return (
    <div className="flex flex-row items-center w-100 space-x-8 px-8 bg-blue-50 h-16 text-gray-300 font-semibold text-sm">
      <div className="text-3xl text-yellow-50 animate-pulse">
        <RiHeartPulseFill />
      </div>
      {loggedIn ? (
      <>
      <div>
        <SearchBar />
      </div>
      <div>
        <Link href="/dashboard">Dashboard</Link>
      </div>
      <div>
        <Link href="/search-coins">Coins</Link>
      </div>
      <div>
        <Link href="/search-sources">Sources</Link>
      </div>
      <span className="flex-grow"></span>
      <div className="pt-1">
        <Notifier />
      </div>
      <Link href="/profile">
          <div className="flex flex-row items-center space-x-2 
                          cursor-pointer">
            <div>
                <FaUserCog />
            </div>
            <div>
              { username }
            </div>
          </div>
      </Link>
      <button
        onClick={logout}
        className="bg-yellow-50 text-blue-50 rounded py-2 px-4">
        Logout
      </button>
      </>
      ) : (
      <>
        <span className="flex-grow"></span>
        <div>
          <Link href="/">Home</Link>
        </div>
        <div>
          <Link href="/login">Log In</Link>
        </div>
        <button className="bg-yellow-50 text-blue-50 py-2 px-4 rounded">
          <Link href="/signup">Sign Up</Link>
        </button>
      </>
      )}
    </div>
  );
}
