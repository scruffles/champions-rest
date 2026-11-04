import React from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Home from "./Home";
import Highlights from "./articles/Highlights";
import Archive from "./articles/Archive";
import ArticleDetail from "./articles/ArticleDetail";
import Biography from "./Biography";
import Record from "./Record";
import About from "./About";

function ScrollToTop() {
  const { pathname } = useLocation();
  const page = pathname.replace(/\/(clipping|text|page|scan)$/, "");
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);
  return null;
}

const routes = () => (
  <BrowserRouter>
    <ScrollToTop />
    <div className="paper">
      <div className="age-top" aria-hidden="true" />
      <div className="age-bot" aria-hidden="true" />
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" Component={Home} />
          <Route path="/biography" Component={Biography} />
          <Route path="/record" Component={Record} />
          <Route path="/articles" Component={Highlights} />
          <Route path="/articles/archive" Component={Archive} />
          <Route path="/articles/:id/:selection?" Component={ArticleDetail} />
          <Route path="/about" Component={About} />
        </Routes>
      </main>
    </div>
  </BrowserRouter>
);

export default routes;
