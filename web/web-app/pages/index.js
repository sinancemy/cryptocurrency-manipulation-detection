import Link from "next/link";

export default function Home() {
  return (
    <div>
      <div className="container mx-auto border-2 my-6 border-yellow-50 rounded-2xl drop-shadow-2xl bg-opacity-20 bg-blue-50">
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
            <Link href="/login">Sign Up Now!</Link>
          </button>
        </div>
      </div>
    </div>
  );
}
