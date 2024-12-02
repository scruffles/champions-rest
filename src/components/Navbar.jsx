import React from "react";
import { NavLink } from "react-router-dom";

export default class Navbar extends React.Component {
  render() {
    return (
      <nav className="navbar fixed-top navbar-expand-sm navbar-dark">
        <NavLink to="/" className="navbar-brand nav-link">
          <img src="/images/logo.png" />
          <div className="title">Champion's Rest</div>
          <div className="subtitle">The life of champion boxer Tom Allen</div>
        </NavLink>
        <ul className="navbar-nav mr-auto" />
        <ul className="navbar-nav">
          <li className="nav-item">
            <NavLink to="/biography" className="nav-link">
              Biography
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/articles" className="nav-link">
              Articles
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/record" className="nav-link">
              Record
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/about" className="nav-link">
              About
            </NavLink>
          </li>
        </ul>
      </nav>
    );
  }
}
