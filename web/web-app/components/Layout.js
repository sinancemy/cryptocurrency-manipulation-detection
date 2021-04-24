import React from "react";
import Nav from "./Nav";

export default function Layout({children, userInfo, loggedIn}) {
  return (
    <div>
      <Nav loggedIn={loggedIn} userInfo={userInfo} />
      {children}
    </div>
  );
}
