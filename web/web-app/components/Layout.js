import React from "react";
import Nav from "./Nav";

export default function Layout({children, logged_in}) {
  return (
    <div>
      <Nav logged_in={logged_in} />
      {children}
    </div>
  );
}
