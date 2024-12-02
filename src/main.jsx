import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.less";
import App from "./components/routes.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
