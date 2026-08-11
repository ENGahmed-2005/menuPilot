/**
 * Runtime smoke test for menuPilot.
 *
 * Renders each route in jsdom against the in-memory mock backend and fails
 * on any React error, unhandled rejection, or console error. This catches
 * runtime bugs that `vite build` and eslint cannot see.
 *
 * Usage: node scripts/smoke.test.mjs
 */
import { JSDOM } from "jsdom";
import { createServer } from "vite";

/* ------------------------------- jsdom env ------------------------------- */
const dom = new JSDOM("<!doctype html><html><head></head><body><div id='root'></div></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});

const problems = [];

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Element = dom.window.Element;
globalThis.Node = dom.window.Node;
globalThis.Event = dom.window.Event;
globalThis.CustomEvent = dom.window.CustomEvent;
globalThis.MutationObserver = dom.window.MutationObserver;
globalThis.getComputedStyle = dom.window.getComputedStyle;
globalThis.localStorage = dom.window.localStorage;
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });

// jsdom has no canvas; qrcode.react only needs a stub in this test.
dom.window.HTMLCanvasElement.prototype.getContext = () => ({
  fillRect: () => {},
  clearRect: () => {},
  getImageData: () => ({ data: [] }),
  putImageData: () => {},
  createImageData: () => [],
  setTransform: () => {},
  drawImage: () => {},
  save: () => {},
  restore: () => {},
  beginPath: () => {},
  closePath: () => {},
  stroke: () => {},
  fill: () => {},
  translate: () => {},
  scale: () => {},
  rotate: () => {},
  arc: () => {},
  measureText: () => ({ width: 0 }),
});
dom.window.HTMLCanvasElement.prototype.toDataURL = () => "data:image/png;base64,";

const origError = console.error;
console.error = (...args) => {
  const msg = args.map((a) => (a?.message ? a.message : String(a))).join(" ");
  // React's act() advisory is noise in this harness.
  if (!msg.includes("not wrapped in act")) problems.push(`console.error: ${msg}`);
  origError(...args);
};

process.on("unhandledRejection", (err) => {
  problems.push(`unhandledRejection: ${err?.message || err}`);
});

/* ------------------------------ vite loader ------------------------------ */
// React/ReactDOM are CJS: import them natively, not through Vite's SSR runner.
const React = (await import("react")).default;
const { act } = await import("react");
const { createRoot } = await import("react-dom/client");

const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "error",
  optimizeDeps: { noDiscovery: true, include: [] },
  resolve: {
    // Ensure app modules share the same React instance as this harness.
    dedupe: ["react", "react-dom"],
  },
  ssr: {
    // Let Vite externalize node_modules so CJS deps (react, axios, form-data)
    // load through Node's native require instead of being inlined.
    noExternal: ["qrcode.react"],
  },
});

// Install the mock adapter exactly like main.jsx does.
const { default: api } = await server.ssrLoadModule("/src/api/client.js");
const { default: installMock } = await server.ssrLoadModule("/src/api/mock/server.js");
installMock(api);

const { default: App } = await server.ssrLoadModule("/src/App.jsx");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function renderAt(path, label) {
  problems.length = 0;
  dom.window.history.pushState({}, "", path);

  const container = document.getElementById("root");
  container.innerHTML = "";
  let root;

  await act(async () => {
    root = createRoot(container);
    root.render(React.createElement(App));
  });

  // Let the mock backend (260ms latency) resolve and re-render.
  await act(async () => {
    await sleep(900);
  });

  const text = container.textContent || "";
  const html = container.innerHTML || "";

  await act(async () => {
    root.unmount();
  });

  return { label, path, text, html, problems: [...problems] };
}

/* --------------------------------- run ---------------------------------- */
const results = [];
let failed = 0;

function check(result, mustInclude) {
  const missing = mustInclude.filter((needle) => !result.text.includes(needle));
  const ok = result.problems.length === 0 && missing.length === 0 && result.html.length > 0;
  if (!ok) failed += 1;

  results.push({
    label: result.label,
    path: result.path,
    ok,
    missing,
    problems: result.problems,
    empty: result.html.length === 0,
  });
  return ok;
}

// 1. Public routes
check(await renderAt("/", "landing"), ["menuPilot"]);
check(await renderAt("/login", "login"), ["owner@menupilot.app"]);
check(await renderAt("/register", "register"), []);
check(await renderAt("/no-such-page", "404"), []);

// 2. Customer journey: resolve a seeded QR token
const { resetMockDb } = await server.ssrLoadModule("/src/api/mock/server.js");
resetMockDb();

const qrToken = "tbl-a1b2c3";
check(await renderAt(`/t/${qrToken}`, "qr landing"), []);

// Start a session through the real service layer, then render the session app.
const { publicApi, authApi } = await server.ssrLoadModule("/src/api/services.js");
const started = await publicApi.startSession(qrToken, {
  customerName: "سارة",
  customerPhone: "0551234567",
});
const sessionCode = started.session.code;

check(await renderAt(`/s/${sessionCode}`, "customer session"), []);

// Place an order so kitchen/orders/bill screens have data.
const menu = await publicApi.menu(qrToken);
await publicApi.placeOrder(sessionCode, {
  items: [
    { itemId: menu.items[0].id, quantity: 2, note: "بدون بصل" },
    { itemId: menu.items[3].id, quantity: 1, note: "" },
  ],
});
await publicApi.requestBill(sessionCode);

check(await renderAt(`/s/${sessionCode}`, "customer session w/ order"), []);

// 3. Authenticated owner routes
await authApi.login({ email: "owner@menupilot.app", password: "password123" });

check(await renderAt("/admin", "dashboard"), []);
check(await renderAt("/admin/orders", "orders"), []);
check(await renderAt("/admin/sessions", "sessions"), []);
check(await renderAt("/admin/tables", "tables"), []);
check(await renderAt("/admin/menu", "menu"), []);
check(await renderAt("/admin/settings", "settings"), []);
check(await renderAt("/kitchen", "kitchen"), []);

/* -------------------------------- report -------------------------------- */
console.log("\n=== menuPilot runtime smoke test ===\n");
for (const r of results) {
  const status = r.ok ? "PASS" : "FAIL";
  console.log(`${status}  ${r.label.padEnd(26)} ${r.path}`);
  if (r.empty) console.log("      -> rendered nothing");
  for (const m of r.missing) console.log(`      -> missing text: ${m}`);
  for (const p of r.problems) console.log(`      -> ${p}`);
}

console.log(`\n${results.length - failed}/${results.length} routes rendered cleanly`);

await server.close();
process.exit(failed === 0 ? 0 : 1);
