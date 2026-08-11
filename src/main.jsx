import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css";

// Use the in-memory mock backend unless explicitly disabled.
// Set VITE_USE_MOCK=false (and VITE_API_URL=http://localhost:8000/api) to hit Laravel.
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

if (USE_MOCK) {
  const { default: installMock } = await import("./api/mock/server.js");
  const { default: api } = await import("./api/client.js");
  installMock(api);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
