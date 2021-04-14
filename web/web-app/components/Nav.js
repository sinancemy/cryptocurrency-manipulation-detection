import React from "react";
import Link from "next/link";

export default function Nav() {
  return (
    <div className="py-4 px-8 bg-blue-50 text text-white flex justify-between">
      <div className="flex text-xl items-center text-yellow-50">
        <Link href="/">Company Logo</Link>
      </div>
      <div className="flex items-center">
        <div className="ml-8">
          <Link href="/dashboard">Dashboard</Link>
        </div>
        <div className="ml-8">
          <Link href="/search-coins">Search Coins</Link>
        </div>
        <div className="ml-8">
          <Link href="/search-posts">Search Posts</Link>
        </div>
        <div className="ml-8">
          <Link href="/profile">Profile</Link>
        </div>
        <div className="ml-8">
          <Link href="/login">Log In</Link>
        </div>
        <button className="ml-8 bg-yellow-50 text-blue-50 py-2 px-4 rounded">
          <Link href="/signup">Sign Up</Link>
        </button>
      </div>
    </div>
  );
}
