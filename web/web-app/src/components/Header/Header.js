import React from "react";
import "./Header.css";

function Header() {
  return (
    <header className="header">
      <div className="left-side">
        <a className="company-name" href="#">
          Company Logo
        </a>
      </div>
      <div className="right-side">
        <a className="login-link" href="#">
          Sign In
        </a>
        <button className="register-button">Sign Up</button>
      </div>
    </header>
  );
}

export default Header;
