import { JSDOM } from "jsdom";
import { createServer } from "vite";

const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Element = dom.window.Element;
globalThis.Node = dom.window.Node;
globalThis.Event = dom.window.Event;
globalThis.MutationObserver = dom.window.MutationObserver;
globalThis.getComputedStyle = dom.window.getComputedStyle;
globalThis.localStorage = dom.window.localStorage;
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
dom.window.HTMLCanvasElement.prototype.getContext = () => ({ measureText: () => ({ width: 0 }) });
dom.window.HTMLCanvasElement.prototype.toDataURL = () => "data:,";

const React = (await import("react")).default;
const { act } = await import("react");
const { createRoot } = await import("react-dom/client");

const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "error",
  optimizeDeps: { noDiscovery: true, include: [] },
  resolve: { dedupe: ["react", "react-dom"] },
  ssr: { noExternal: ["qrcode.react"] },
});

const { default: api } = await server.ssrLoadModule("/src/api/client.js");
const { default: installMock, resetMockDb } = await server.ssrLoadModule("/src/api/mock/server.js");
installMock(api);
resetMockDb();
localStorage.clear();

const res = await api.post("/auth/login", {
  email: "owner@menupilot.app",
  password: "password123",
});
localStorage.setItem("menupilot.token", res.data.data.token);

const { default: App } = await server.ssrLoadModule("/src/App.jsx");

// Trace every API call so we can see which request never settles.
api.interceptors.request.use((cfg) => {
  console.log(`  -> ${String(cfg.method).toUpperCase()} ${cfg.url}`);
  return cfg;
});
api.interceptors.response.use(
  (r) => {
    console.log(`  <- OK ${r.config.url}`);
    return r;
  },
  (e) => {
    console.log(`  <- ERR ${e.status ?? "?"} ${e.message ?? e}`);
    return Promise.reject(e);
  }
);
process.on("unhandledRejection", (e) => console.log("  !! unhandledRejection:", e?.message || e));

const target = process.argv[2] || "/admin/tables";
dom.window.history.pushState({}, "", target);
const container = document.getElementById("root");

let root;
await act(async () => {
  root = createRoot(container);
  root.render(React.createElement(App));
});
await act(async () => {
  await new Promise((r) => setTimeout(r, 1200));
});

console.log("=== PATH:", dom.window.location.pathname);
console.log("=== BUTTONS ===");
for (const b of container.querySelectorAll("button, a")) {
  const label = (b.textContent || "").trim().replace(/\s+/g, " ");
  if (label) console.log(`  [${b.tagName}] "${label}"`);
}
console.log("\n=== TEXT (first 900) ===");
console.log((container.textContent || "").replace(/\s+/g, " ").slice(0, 900));

await server.close();
process.exit(0);
