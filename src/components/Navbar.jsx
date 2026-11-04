import React from "react";
import { Link, NavLink } from "react-router-dom";
import Search from "./Search";
import { InkFilter } from "./shared";
import { ARTICLES, todayLabel } from "../lib/articles";

const NAV = [
  ["/", "Front page"],
  ["/biography", "Biography"],
  ["/articles", "Articles"],
  ["/record", "Record"],
  ["/about", "About"],
];

export default function Navbar() {
  return (
    <header className="masthead">
      <div className="dateline">
        <span>Vol. I · {ARTICLES.length.toLocaleString()} articles</span>
        <span>St. Louis · {todayLabel()}</span>
        <span>The life of Tom Allen 1839–1903</span>
      </div>
      <div className="nameplate">
        <InkFilter />
        <Link to="/" className="nameplate-title">
          Champion's Rest
        </Link>
        <div className="nameplate-sub">The life and times of Tom Allen, champion pugilist of the world</div>
      </div>
      <div className="navrow">
        <nav aria-label="Main">
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              {label}
            </NavLink>
          ))}
        </nav>
        <Search />
      </div>
    </header>
  );
}
