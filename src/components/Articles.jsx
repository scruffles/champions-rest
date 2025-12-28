import React from "react";
import { db } from "../../data/database";
import moment from "moment";
import { useMatch, useNavigate } from "react-router-dom";
import { marked } from "marked";
import Fuse from "fuse.js";

const dedent = (str) => {
  const lines = str.split("\n");
  const nonEmptyLines = lines.slice(
    lines.findIndex((line) => line.trim() !== ""),
  );

  // Calculate the minimum indent level
  const indentLevel = nonEmptyLines.reduce((minIndent, line) => {
    const leadingWhitespace = line.match(/^[ \t]*/)[0].length;
    return !line.trim() ? minIndent : Math.min(minIndent, leadingWhitespace);
  }, Number.MAX_SAFE_INTEGER);

  // Remove the determined indent from each line
  const dedentedLines = nonEmptyLines.map((line) =>
    line.substring(indentLevel),
  );

  // Join the lines back to a single string
  return dedentedLines.join("\n");
};

const getSummary = (article) => {
  if (article.summary) return article.summary;
  if (!article.text) return "";

  const cleanText = dedent(article.text).replace(/\n/g, " ");
  if (cleanText.length <= 150) return cleanText;
  return cleanText.substring(0, 150).trim() + "...";
};

const ArticleSummary = ({ article, date, yearTitle, onClick, isSelected }) => (
  <li key={article.id} className={`article-${article.id}`}>
    {yearTitle}
    <div onClick={onClick} className={isSelected ? "selected" : "selectable"}>
      <div className="article-title">{article.title}</div>
      <div>
        <span className="article-publication">{article.publication}</span>
        {" - "}
        <span className="article-date">{date.format("MMMM Do YYYY")}</span>
      </div>
      <div>{getSummary(article)}</div>
    </div>
  </li>
);

const zoomStepSize = 80; // percent to zoom for each button press

function ZoomableImage({ image, fullScreen = false, setFullScreen }) {
  const [width, setWidth] = React.useState(100);

  return (
    <div style={{ position: "relative" }}>
      <div className={"zoom-controls"}>
        <div>
          <a
            href={"#"}
            onClick={(e) => {
              e.preventDefault();
              setWidth(width + zoomStepSize);
            }}
          >
            <i className="fa-solid fa-magnifying-glass-plus"></i>
          </a>
        </div>
        <div>
          <a
            href={"#"}
            onClick={(e) => {
              e.preventDefault();
              if (width > 100) {
                setWidth(Math.max(width - zoomStepSize, 100));
              }
            }}
          >
            <i
              className="fa-solid fa-magnifying-glass-minus"
              style={{ opacity: width <= 100 ? 0.5 : 1 }}
            />
          </a>
        </div>
        <div>
          <a
            href={"#"}
            onClick={(e) => {
              e.preventDefault();
              setFullScreen(!fullScreen);
            }}
          >
            <i
              className={`fa-solid ${fullScreen ? "fa-compress" : "fa-expand"}`}
            />
          </a>
        </div>
      </div>
      <div className="scrollable-preview">
        <img
          src={`${image}`}
          style={{ width: `${width}%` }}
          onClick={(e) => {
            e.preventDefault();
            setWidth(width + zoomStepSize);
          }}
        />
      </div>
    </div>
  );
}

const PreviewPanel = ({ article, selection, fullScreen, setFullScreen }) => {
  const navigate = useNavigate();
  let markdown = article?.text
    ? marked.parse(dedent(article.text))
    : "no text available";

  return (
    <div className="preview-panel">
      <div className="preview-selection">
        {article?.text && (
          <a
            href="#"
            className={selection === "text" ? "selected" : ""}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/articles/${article.id}/text`);
            }}
          >
            text
          </a>
        )}
        <a
          href="#"
          className={selection === "scan" ? "selected" : ""}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/articles/${article.id}/scan`);
          }}
        >
          scan
        </a>
        <a
          href="#"
          className={selection === "page" ? "selected" : ""}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/articles/${article.id}/page`);
          }}
        >
          full page
        </a>
      </div>
      <div>
        {article ? (
          selection === "scan" ? (
            <div className="scrollable-preview">
              <img
                src={`/${article.localCopyEdited}`}
                className="preview-image"
              />
            </div>
          ) : selection === "page" ? (
            <ZoomableImage
              image={`/${article.localCopyFull}`}
              fullScreen={fullScreen}
              setFullScreen={setFullScreen}
            />
          ) : selection === "text" ? (
            <div className="scrollable-preview" style={{border: 'none'}}>
              <div
                className={"article-text"}
                dangerouslySetInnerHTML={{ __html: markdown }}
              ></div>
            </div>
          ) : null
        ) : null}
      </div>
    </div>
  );
};

const Articles = () => {
  const navigate = useNavigate();
  const match = useMatch("/articles/:id/:selection?");
  const [showSearch, setShowSearch] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState([]);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const fuse = React.useMemo(() => {
    return new Fuse(db, {
      keys: ["title", "publication", "summary", "text"],
      threshold: 0.3,
      includeMatches: true,
    });
  }, []);

  React.useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const results = fuse.search(searchQuery);
      setSearchResults(results.map((r) => r.item));
      setActiveIndex(0);
    } else {
      setSearchResults([]);
      setActiveIndex(-1);
    }
  }, [searchQuery, fuse]);

  React.useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Check if 'S' or 's' is pressed
      if (e.key.toLowerCase() === "s") {
        // Don't open search if the user is typing in an input or textarea
        const activeElement = document.activeElement;
        const isTyping =
          activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.isContentEditable;

        if (!isTyping && !showSearch) {
          e.preventDefault();
          setShowSearch(true);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [showSearch]);

  React.useEffect(() => {
    if (match?.params?.id) {
      document.querySelector(`.article-${match?.params?.id}`).scrollIntoView({
        behavior: "instant",
        block: "center",
        inline: "center",
      });
    }
  }, [match?.params?.id]);
  const [fullScreen, setFullScreen] = React.useState(false);

  React.useEffect(() => {
    if (activeIndex >= 0) {
      const activeElement = document.querySelector(
        "#search-results-list li.active",
      );
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [activeIndex]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < searchResults.length) {
        setSelectedArticle(searchResults[activeIndex]);
        setShowSearch(false);
      }
    } else if (e.key === "Escape") {
      setShowSearch(false);
    }
  };

  const setSelectedArticle = (selectedArticle) => {
    navigate(`/articles/${selectedArticle.id}`);
  };

  let currentYear = null;

  const getYearTitleIfChange = (year) => {
    const prevYear = currentYear;
    currentYear = year;
    return prevYear !== year ? (
      <div className="year-divider">{year}</div>
    ) : null;
  };

  let selectedArticle = db.find((article) => article.id === match?.params?.id);
  return (
    <div className="article-page">
      <div
        className="floating-search-button"
        onClick={() => setShowSearch(true)}
      >
        <i className="fa-solid fa-magnifying-glass"></i>
      </div>
      {showSearch && (
        <div className="search-overlay" onClick={() => setShowSearch(false)}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-input-container">
              <input
                type="text"
                autoFocus
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="close-search"
                onClick={() => setShowSearch(false)}
              >
                &times;
              </button>
            </div>
            <div className="search-results">
              {searchResults.length > 0 ? (
                <ul id="search-results-list">
                  {searchResults.map((article, index) => (
                    <li
                      key={article.id}
                      className={index === activeIndex ? "active" : ""}
                      onClick={() => {
                        setSelectedArticle(article);
                        setShowSearch(false);
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      <div className="result-title">{article.title}</div>
                      <div className="result-summary">{getSummary(article)}</div>
                    </li>
                  ))}
                </ul>
              ) : searchQuery.length > 2 ? (
                <div className="no-results">No results found</div>
              ) : null}
            </div>
          </div>
        </div>
      )}
      {fullScreen && (
        <div className={"full-screen-image-container"}>
          <ZoomableImage
            image={`/${selectedArticle.localCopyFull}`}
            fullScreen={fullScreen}
            setFullScreen={setFullScreen}
          />
        </div>
      )}
      <div className="container">
        <div className="scrollable">
          <div className="article-list">
            <ul>
              {db.map((article) => {
                const isSelected = article.id === match?.params?.id;
                const date = moment(article.sourceDate, "YYYY-MM-DD");
                return (
                  <ArticleSummary
                    key={article.id}
                    article={article}
                    date={date}
                    yearTitle={getYearTitleIfChange(date.get("year"))}
                    onClick={() => setSelectedArticle(article)}
                    isSelected={isSelected}
                  />
                );
              })}
            </ul>
          </div>
          <PreviewPanel
            article={selectedArticle}
            selection={
              match?.params?.selection ||
              (selectedArticle?.text ? "text" : "scan")
            }
            fullScreen={fullScreen}
            setFullScreen={setFullScreen}
          />
        </div>
      </div>
    </div>
  );
};

export default Articles;

// "publication": "St. Louis Post-Dispatch",
// "sourceDate": "1936-06-21",
// "title": "Tom Allen called out as the only champion to ever lose and regain his championship",
// "localCopyEdited": "public/images/articles/image-251.jpg",
// "localCopyFull": "public/images/articles/image-251b.jpg",
// "id": "251"
