import React from "react";
import Nav from "./Nav";

export default function Layout({children, loggedIn}) {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-none">
        <Nav />
      </div>
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
}
