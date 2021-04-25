import { useRouter } from "next/router"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import Graph from "../../components/Graph"
import { withParentSize } from "@vx/responsive"
import axios from "axios"


export async function getServerSideProps(context) {
  const coins = await (await fetch("http://127.0.0.1:5000/api/coin_list")).json()
  return {
    props: {
      coins: coins,
    }
  }
}

export default function Dashboard({coins, loggedIn}) {
  
  const ResponsiveGraph = withParentSize(Graph)
  const [graphSettings, setGraphSettings] = useState({
    coinType: "eth",
    extent: "week",
    timeWindow: 30,
  })
  const [selectedRange, setSelectedRange] = useState(null)
  const [graphLoading, setGraphLoading] = useState(true)
  const [prices, setPrices] = useState([])
  const [posts, setPosts] = useState([])

  const router = useRouter()
  // If the user is not logged in, then redirect back to the home page.
  useEffect(() => {
    if(!loggedIn) {
      router.push("/login")
    }
    setGraphLoading(false)
  }, [])

  // Listen to changes in the selected range and update shown the posts.
  useEffect(() => {
    if(selectedRange == null) return
    const pw0 = selectedRange.midDate.valueOf() - (graphSettings.timeWindow/2) * 1000 * 60 * 60 * 24
    const pw1 = selectedRange.midDate.valueOf() + (graphSettings.timeWindow/2) * 1000 * 60 * 60 * 24
    axios.get("http://127.0.0.1:5000/api/posts", {
      params: {
        start: parseInt(pw0/1000),
        end: parseInt(pw1/1000),
        type: graphSettings.coinType
      }
    }).then(res => {
      setPosts(res.data)
    })
  }, [selectedRange, graphSettings])

  // Listen to changes in the graph settings and update the prices shown on the graph.
  useEffect(() => {
    const decrement = 60 * 60 * 24 * ((graphSettings.extent === "day") ? 1 : 
                                      (graphSettings.extent === "month") ? 30 :
                                      (graphSettings.extent === "week") ? 7 : 365)
    const winHigh = 1583625601
    const winLow = winHigh - decrement
    axios.get("http://127.0.0.1:5000/api/prices", {
      params: {
        start: winLow,
        end: winHigh,
        type: graphSettings.coinType
      }
    }).then(res => {
      const prices = res.data?.reverse()
      setPrices(prices)
    })
  }, [graphSettings])

  return (
    <div className="animate-fade-in-down container mx-auto py-4 grid lg:grid-cols-5 gap-4 text-yellow-50">
      <div className="border-2 border-yellow-50 rounded-2xl drop-shadow-2xl bg-opacity-20 bg-blue-50 p-4 max-h-64 overflow-y-auto">
        <h1 className="text-xl font-bold underline">Followed Coins</h1>
        <ul className="mt-2 ">
          {coins.map((coin, i) => (
            <li className="flex items-center mt-2" key={i}>
              <img className="h-12 w-12" src={coin.image} alt="logo" />
              <p className="ml-2">{coin.name}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="h-80 rounded-2xl drop-shadow-2xl overflow-hidden lg:col-span-3 bg-blue-128">
        <ResponsiveGraph 
          loading={graphLoading} 
          stock={prices} 
          graphSettings={graphSettings} 
          selectedRange={selectedRange} 
          setSelectedRange={setSelectedRange}
        />
      </div>
      <div className="border-2 border-yellow-50 rounded-2xl drop-shadow-2xl bg-opacity-20 bg-blue-50 p-4">
        <h1 className="text-xl font-bold underline">View</h1>
        <ul className="mt-2">
          <li>
            <button 
              className={graphSettings.extent === "day" && ("font-bold underline")}
              onClick={e => setGraphSettings({ ...graphSettings, extent: "day" })}
            >
              Last day
            </button>
          </li>
          <li>
            <button 
              className={graphSettings.extent === "week" && ("font-bold underline")}
              onClick={e => setGraphSettings({ ...graphSettings, extent: "week" })}
            >
              Last week
            </button>
          </li>
          <li>
            <button 
              className={graphSettings.extent === "month" && ("font-bold underline")}
              onClick={e => setGraphSettings({ ...graphSettings, extent: "month" })}
            >
              Last month
            </button>
          </li>
          <li>
            <button 
              className={graphSettings.extent === "year" && ("font-bold underline")}
              onClick={() => setGraphSettings({ ...graphSettings, extent: "year" })}
            >
              Last year
            </button>
          </li>
        </ul>
        <div class="mt-2 border-t pt-3">
          <div class="flex flex-row">
            <button
              className={graphSettings.timeWindow === 5 && ("font-bold underline")}
              onClick={() => setGraphSettings({ ...graphSettings, timeWindow: 5 })}
            >
              5
            </button>
            <button
              className={`ml-1 ${graphSettings.timeWindow === 10 && ("font-bold underline")}`}
              onClick={() => setGraphSettings({ ...graphSettings, timeWindow: 10 })}
            >
              10
            </button>
            <button
              className={`ml-1 ${graphSettings.timeWindow === 30 && ("font-bold underline")}`}
              onClick={() => setGraphSettings({ ...graphSettings, timeWindow: 30 })}
            >
              30
            </button>
            <button
              className={`ml-1 ${graphSettings.timeWindow === 60 && ("font-bold underline")}`}
              onClick={() => setGraphSettings({ ...graphSettings, timeWindow: 60 })}
            >
              60
            </button>
            <span className="ml-1">days.</span>
          </div>
        </div>
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
            <span className="font-semibold">{ selectedRange && ( selectedRange.mid.price.toFixed(2) ) }</span>
            <span className="ml-1">BTC/USDT</span> at{" "}
            <span className="font-semibold">{ selectedRange && ( new Date(selectedRange.midDate).toLocaleString() ) }</span>
          </div>
          <div>
            sort by <button className="font-bold underline">time</button>
          </div>
        </div>
        <ul className="max-h-64 overflow-y-auto mt-2">
          {posts.map((post, i) => (
            <li
              key={i}
              className="grid grid-cols-5 gap-3 text-black border py-1 px-4 bg-white justify-between rounded-md mt-2"
            >
              <div>
                <span className="font-semibold underline width-50">{post.user}</span><br /> 
                {post.source}
              </div>
              <div className="col-span-3">
                <p>{post.content}</p>
              </div>
              <div>
                <p className="text-sm">{new Date(post.time*1000).toLocaleString('en-US', {hour12: false})}
                <br />
                Interaction: {post.interaction}</p>
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
