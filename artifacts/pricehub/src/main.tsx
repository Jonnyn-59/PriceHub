import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Default to dark theme on first paint to avoid white background flash.
document.documentElement.classList.add("dark");

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
if (typeof apiBaseUrl === "string" && apiBaseUrl.trim() !== "") {
  setBaseUrl(apiBaseUrl);
}

createRoot(document.getElementById("root")!).render(<App />);
