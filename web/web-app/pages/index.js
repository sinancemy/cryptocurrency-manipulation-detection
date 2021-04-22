import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Home({ loggedIn }) {

  const router = useRouter()
  // If the user is already logged in, then redirect back to the home page.
  useEffect(() => {
    if(loggedIn) {
      router.push("/dashboard")
    }})

  return (
    <div>
      <div className="animate-fade-in-down container mx-auto border-2 my-6 border-yellow-50 rounded-2xl drop-shadow-2xl bg-opacity-20 bg-blue-50">
        <h1 className="text-5xl text-center my-6 font-semibold text-white">
          Cryptocurrency Speculation Detection Through Social Media Analysis
        </h1>
        <p className="text-3xl text-center font-semibold text-gray-400">
          Analysis of cryptocurrencies has never been easier.
        </p>
        <div className="container mx-auto my-6 flex justify-center">
          <button className="ml-8 h-12 bg-yellow-50 text-xl text-blue-50 py-2 px-4 rounded">
            <Link href="#">Learn More</Link>
          </button>
          <button className="ml-8 h-12 bg-yellow-50 text-xl text-blue-50 py-2 px-4 rounded">
            <Link href="/signup">Sign Up Now!</Link>
          </button>
        </div>
        <div className="h-64"></div>
      </div>
    </div>
  );
}
