export default function Dashboard() {
  const data = [
    {
      id: 1,
      name: "Bitcoin",
      image:
        "https://www.dhresource.com/0x0/f2/albu/g9/M00/27/85/rBVaVVxO822ACwv4AALYau1h4a8355.jpg/500pcs-30mm-diameter-bitcoin-logo-label-sticker.jpg",
    },
    {
      id: 2,
      name: "MFT",
      image:
        "https://www.dhresource.com/0x0/f2/albu/g9/M00/27/85/rBVaVVxO822ACwv4AALYau1h4a8355.jpg/500pcs-30mm-diameter-bitcoin-logo-label-sticker.jpg",
    },
    {
      id: 3,
      name: "Ethereum",
      image:
        "https://www.dhresource.com/0x0/f2/albu/g9/M00/27/85/rBVaVVxO822ACwv4AALYau1h4a8355.jpg/500pcs-30mm-diameter-bitcoin-logo-label-sticker.jpg",
    },
  ];

  const tweets = [
    {
      id: 1,
      username: "elon musk",
      text: "Odit atque alias ab.",
      created_at: new Date().toLocaleDateString(),
      interaction: 12,
    },
    {
      id: 2,
      username: "nostrum-culpa-amet",
      text: "Dolore inventore saepe exercitationem.",
      created_at: new Date().toLocaleDateString(),
      interaction: 55,
    },
    {
      id: 3,
      username: "soluta-id-at",
      text: "Sed quo quia sunt.",
      created_at: new Date().toLocaleDateString(),
      interaction: 43,
    },
    {
      id: 4,
      username: "soluta-id-at",
      text: "Sed quo quia sunt.",
      created_at: new Date().toLocaleDateString(),
      interaction: 77,
    },
    {
      id: 5,
      username: "soluta-id-at",
      text: "Sed quo quia sunt.",
      created_at: new Date().toLocaleDateString(),
      interaction: 123,
    },
  ];

  return (
    <div className="container mx-auto py-4 grid lg:grid-cols-5 gap-4 text-yellow-50">
      <div className="border-2 border-yellow-50 rounded-2xl drop-shadow-2xl bg-opacity-20 bg-blue-50 p-4 max-h-64 overflow-y-auto">
        <h1 className="text-xl font-bold underline">Followed Coins</h1>
        <ul className="mt-2  ">
          {data.map((coin, i) => (
            <li className="flex items-center mt-2" key={i}>
              <img className="h-12 w-12" src={coin.image} alt="logo" />
              <p className="ml-2">{coin.name}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-2 border-yellow-50 rounded-2xl drop-shadow-2xl bg-opacity-20 bg-blue-50 p-4 lg:col-span-3">
        Accusamus voluptatem vitae amet dignissimos et dolores vero. Rem sed cum
        velit similique sint. Autem neque sed. Et fugit rerum possimus qui totam
        consectetur maiores similique.
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
          {data.map((coin, i) => (
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
              className="flex text-black border py-1 px-4 bg-white items-center justify-between rounded-md mt-2"
            >
              <span className="font-semibold underline">{tweet.username}</span>
              <p className="flex-1 ml-2">{tweet.text}</p>
              <div>
                <p className="font-semibold">{tweet.created_at}</p>
                <span className="font-semibold">Interaction: </span>
                {tweet.interaction}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-2 border-yellow-50 rounded-2xl drop-shadow-2xl bg-opacity-20 bg-blue-50 p-4 max-h-64 overflow-y-auto">
        <h1 className="text-xl font-bold underline">Predictions</h1>
        <ul className="mt-2">
          {data.map((coin, i) => (
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
