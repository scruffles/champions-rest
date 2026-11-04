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

const NavLinks = ({ label }) => (
  <nav aria-label={label}>
    {NAV.map(([to, text]) => (
      <NavLink key={to} to={to} end={to === "/"}>
        {text}
      </NavLink>
    ))}
  </nav>
);

// Shows the compact bar as soon as the top of the full masthead's nav row is cut off by the viewport edge.
function useScrolledPast(ref) {
  const [past, setPast] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setPast(entry.intersectionRatio < 1 && entry.boundingClientRect.top < 0);
      },
      { threshold: [0, 1] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return past;
}

export default function Navbar() {
  const navRowRef = React.useRef(null);
  const compact = useScrolledPast(navRowRef);

  return (
    <>
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
        <div className="navrow" ref={navRowRef}>
          <NavLinks label="Main" />
          <Search />
        </div>
      </header>

      <div className={`compact-bar ${compact ? "shown" : ""}`} aria-hidden={!compact} {...(compact ? {} : { inert: "" })}>
        <div className="compact-inner">
          <Link to="/" className="compact-title">
            Champion's Rest
          </Link>
          <NavLinks label="Main (compact)" />
          <Search />
        </div>
      </div>
    </>
  );
}
