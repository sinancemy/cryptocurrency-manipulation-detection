import { useRouter } from "next/router"
import { useEffect, useRef, useState } from "react"

export async function getServerSideProps(context) {
  const coins = await (await fetch("http://127.0.0.1:5000/api/coin_list")).json()
  const tweets = await (await fetch("http://127.0.0.1:5000/api/posts")).json()

  const prices_fetched = await (await fetch("http://127.0.0.1:5000/api/prices?start=0&type=eth")).json()
  const labels = prices_fetched.map(p => p.time * 1000)
  const datapoints = prices_fetched.map(p => p.price)


  return {
    props: {
      coins: coins,
      tweets: tweets,
      pricesLabels: labels,
      pricesDps: datapoints
    }
  }
}

export default function Dashboard({coins, tweets, loggedIn, pricesLabels, pricesDps}) {

  const router = useRouter()
  // If the user is not logged in, then redirect back to the home page.
  useEffect(() => {
    if(!loggedIn) {
      router.push("/login")
    }})

  return (
    <div className="container mx-auto py-4 grid lg:grid-cols-5 gap-4 text-yellow-50">
      <div className="border-2 border-yellow-50 rounded-2xl drop-shadow-2xl bg-opacity-20 bg-blue-50 p-4 max-h-64 overflow-y-auto">
        <h1 className="text-xl font-bold underline">Followed Coins</h1>
        <ul className="mt-2  ">
          {coins.map((coin, i) => (
            <li className="flex items-center mt-2" key={i}>
              <img className="h-12 w-12" src={coin.image} alt="logo" />
              <p className="ml-2">{coin.name}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-2 border-yellow-50 rounded-2xl drop-shadow-2xl bg-opacity-20 bg-blue-50 p-4 lg:col-span-3">
        Not implemented yet...
      </div>
      <div className="border-2 border-yellow-50 rounded-2xl drop-shadow-2xl bg-opacity-20 bg-blue-50 p-4">
        <h1 className="text-xl font-bold underline">View</h1>
        <ul className="mt-2">
          <li className="font-semibold opacity-50">Last day</li>
          <li className="font-semibold">Last week</li>
          <li className="font-semibold opacity-50">Last month</li>
          <li className="font-semibold opacity-50">Last year</li>

          <li className="font-semibold mt-4">Show BTC</li>
          <li className="font-semibold opacity-50">Show ETH</li>

          <li className="font-semibold mt-4">Price in USD</li>
        </ul>
      </div>
      <div className="border-2 border-yellow-50 rounded-2xl drop-shadow-2xl bg-opacity-20 bg-blue-50 p-4 max-h-64 overflow-y-auto">
        <h1 className="text-xl font-bold underline">Followed Sources</h1>
        <ul className="mt-2">
          {coins.map((coin, i) => (
            <li className="flex items-center mt-2" key={i}>
              <img className="h-12 w-12" src={coin.image} alt="logo" />
              <p className="ml-2">{coin.name}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-2 border-yellow-50 rounded-2xl drop-shadow-2xl bg-opacity-20 bg-blue-50 p-4 lg:col-span-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold">59.281,00</span>
            <span className="ml-1">BTC/USDT</span> at{" "}
            <span className="font-semibold">19219219</span>
          </div>
          <div>
            sort by <button className="font-bold underline">time</button>
          </div>
        </div>
        <ul className="max-h-64 overflow-y-auto mt-2">
          {tweets.map((tweet, i) => (
            <li
              key={i}
              className="grid grid-cols-5 gap-3 text-black border py-1 px-4 bg-white justify-between rounded-md mt-2"
            >
              <div>
                <span className="font-semibold underline width-50">{tweet.user}</span><br /> 
                {tweet.source}
              </div>
              <div className="col-span-3">
                <p>{tweet.content}</p>
              </div>
              <div>
                <p className="text-sm">{new Date(tweet.time*1000).toLocaleString('en-US', {hour12: false})}
                <br />
                Interaction: {tweet.interaction}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-2 border-yellow-50 rounded-2xl drop-shadow-2xl bg-opacity-20 bg-blue-50 p-4 max-h-64 overflow-y-auto">
        <h1 className="text-xl font-bold underline">Predictions</h1>
        <ul className="mt-2">
          {coins.map((coin, i) => (
            <li className="flex items-center mt-2" key={i}>
              <img className="h-12 w-12" src={coin.image} alt="logo" />
              <p className="ml-2">{coin.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
