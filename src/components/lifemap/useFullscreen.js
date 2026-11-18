import React from "react";

// Full-screen map: remembered per browser, only on screens big enough to fit everything.
const KEY = "lifemap-full";
const FITS = "(min-width: 900px) and (min-height: 600px)";

function readPref() {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function writePref(on) {
  try {
    window.localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    // Storage blocked (private window): the choice just isn't remembered.
  }
}

export function useFullscreen() {
  const [wanted, setWanted] = React.useState(readPref);
  const [fits, setFits] = React.useState(() => window.matchMedia(FITS).matches);
  const set = React.useCallback((on) => {
    setWanted(on);
    writePref(on);
  }, []);

  React.useEffect(() => {
    const mq = window.matchMedia(FITS);
    const sync = () => setFits(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const active = wanted && fits;

  React.useEffect(() => {
    if (!active) return undefined;
    const html = document.documentElement;
    html.classList.add("lm-full");
    window.scrollTo(0, 0);
    const onKey = (e) => {
      if (e.key !== "Escape" || e.target.closest?.("input, textarea, select, [contenteditable]")) return;
      set(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      html.classList.remove("lm-full");
      window.removeEventListener("keydown", onKey);
    };
  }, [active, set]);

  return { active, fits, set };
}
