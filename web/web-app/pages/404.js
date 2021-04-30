import Link from "next/link";

export default function Custom404() {
  return (
    <div className="flex h-screen">
      <div className="m-auto">
        <img src="/error.png" alt="Error 404" width="1470" height="598" />
        <p className="text-white text-center text-5xl">
          Sorry! The page you’re looking for cannot be found.{" "}
          <text className="text-yellow-50 underline">
            <Link className="" href="/">
              Go to Home
            </Link>
          </text>
        </p>
      </div>
    </div>
  );
}
