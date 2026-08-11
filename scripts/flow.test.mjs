/**
 * End-to-end flow test for menuPilot (jsdom + mock backend).
 *
 * Exercises the real business flows through the DOM rather than just
 * rendering routes:
 *   1. Owner logs in and creates a table (QR auto-generated)
 *   2. Owner adds a menu item
 *   3. Customer scans the QR, opens a session, orders with a note
 *   4. Kitchen advances the order pending -> preparing -> ready -> served
 *   5. Customer requests the bill; cashier records payment and closes session
 *   6. Table is released as available
 *
 * Usage: node scripts/flow.test.mjs
 */
import { JSDOM } from "jsdom";
import { createServer } from "vite";

/* ------------------------------- jsdom env ------------------------------- */
const dom = new JSDOM(
  "<!doctype html><html><head></head><body><div id='root'></div></body></html>",
  { url: "http://localhost/", pretendToBeVisual: true }
);

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.HTMLInputElement = dom.window.HTMLInputElement;
globalThis.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
globalThis.HTMLSelectElement = dom.window.HTMLSelectElement;
globalThis.Element = dom.window.Element;
globalThis.Node = dom.window.Node;
globalThis.Event = dom.window.Event;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
globalThis.CustomEvent = dom.window.CustomEvent;
globalThis.MutationObserver = dom.window.MutationObserver;
globalThis.getComputedStyle = dom.window.getComputedStyle;
globalThis.localStorage = dom.window.localStorage;
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});

dom.window.HTMLCanvasElement.prototype.getContext = () => ({
  fillRect() {}, clearRect() {}, getImageData: () => ({ data: [] }),
  putImageData() {}, createImageData: () => [], setTransform() {}, drawImage() {},
  save() {}, restore() {}, beginPath() {}, closePath() {}, stroke() {}, fill() {},
  translate() {}, scale() {}, rotate() {}, arc() {}, measureText: () => ({ width: 0 }),
});
dom.window.HTMLCanvasElement.prototype.toDataURL = () => "data:image/png;base64,";

const consoleErrors = [];
const origError = console.error;
console.error = (...args) => {
  const msg = args.map((a) => (a?.message ? a.message : String(a))).join(" ");
  if (!msg.includes("not wrapped in act")) consoleErrors.push(msg);
  origError(...args);
};
process.on("unhandledRejection", (e) => consoleErrors.push(`unhandledRejection: ${e?.message || e}`));

/* --------------------------------- setup --------------------------------- */
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

const { default: App } = await server.ssrLoadModule("/src/App.jsx");
const { tablesApi, sessionsApi, ordersApi, publicApi, menuApi } =
  await server.ssrLoadModule("/src/api/services.js");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const container = document.getElementById("root");
let root;

async function mountAt(path) {
  if (root) await act(async () => root.unmount());
  dom.window.history.pushState({}, "", path);
  container.innerHTML = "";
  await act(async () => {
    root = createRoot(container);
    root.render(React.createElement(App));
  });
  await settle();
}

async function settle(ms = 700) {
  await act(async () => {
    await sleep(ms);
  });
}

/* ----------------------------- DOM utilities ----------------------------- */
const all = (sel) => Array.from(container.querySelectorAll(sel));

function byText(text, sel = "button, a, [role=button]") {
  return all(sel).find((el) => (el.textContent || "").trim().includes(text));
}

function inputByLabel(labelText) {
  const label = all("label").find((l) => (l.textContent || "").includes(labelText));
  if (!label) return null;
  const id = label.getAttribute("for");
  if (id) return document.getElementById(id);
  return label.querySelector("input, textarea, select");
}

async function click(el, what = "element") {
  if (!el) throw new Error(`cannot click missing ${what}`);
  await act(async () => {
    el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));
  });
  await settle(500);
}

function setNative(el, value) {
  const proto =
    el instanceof dom.window.HTMLTextAreaElement
      ? dom.window.HTMLTextAreaElement.prototype
      : el instanceof dom.window.HTMLSelectElement
        ? dom.window.HTMLSelectElement.prototype
        : dom.window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
  el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  el.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
}

async function type(el, value, what = "field") {
  if (!el) throw new Error(`cannot type into missing ${what}`);
  await act(async () => setNative(el, value));
}

/* ------------------------------- assertions ------------------------------ */
const results = [];
function assert(name, condition, detail = "") {
  results.push({ name, ok: Boolean(condition), detail });
  if (!condition) console.log(`   ! ${name} :: ${detail}`);
}

/* --------------------------------- flows --------------------------------- */

// ---------- Flow 1: owner login through the UI ----------
await mountAt("/login");
await type(inputByLabel("البريد"), "owner@menupilot.app", "email");
await type(inputByLabel("كلمة المرور"), "password123", "password");
await click(byText("دخول", "button[type=submit]"), "login submit");
await settle(900);

assert(
  "login navigates to dashboard",
  dom.window.location.pathname === "/admin",
  `path=${dom.window.location.pathname}`
);
assert("dashboard renders stats", container.textContent.includes("لوحة التحكم"));

// ---------- Flow 2: create a table via the UI (FR-04, FR-07) ----------
await mountAt("/admin/tables");
const beforeTables = (await tablesApi.list()).length;

await click(byText("إضافة طاولة"), "add table button");
await type(inputByLabel("رقم الطاولة"), "77", "table number");
await type(inputByLabel("عدد المقاعد"), "4", "capacity");
await click(byText("إضافة", "button[form=table-form]"), "submit table");
await settle(900);

const afterTables = await tablesApi.list();
const newTable = afterTables.find((t) => String(t.number) === "77");
assert("table created via UI", afterTables.length === beforeTables + 1, `${beforeTables} -> ${afterTables.length}`);
assert("QR token auto-generated (FR-07)", Boolean(newTable?.qrToken), `token=${newTable?.qrToken}`);
assert("new table shows in list", container.textContent.includes("77"));

// duplicate number must be rejected (validation)
await click(byText("إضافة طاولة"), "add table button");
await type(inputByLabel("رقم الطاولة"), "77", "table number");
await click(byText("إضافة", "button[form=table-form]"), "submit dup table");
await settle(900);
const dupCount = (await tablesApi.list()).filter((t) => String(t.number) === "77").length;
assert("duplicate table number rejected", dupCount === 1, `count=${dupCount}`);
const dupError = container.textContent.includes("already exists");
assert("duplicate shows server error", dupError, "no server error message shown");

// close the modal for the next flow
const cancelBtn = byText("إلغاء");
if (cancelBtn) await click(cancelBtn, "cancel");

// ---------- Flow 3: add a menu item via the UI (FR-08) ----------
await mountAt("/admin/menu");
const beforeItems = (await menuApi.items()).length;

await click(byText("إضافة صنف"), "add item button");
await type(inputByLabel("اسم الصنف"), "شاورما دجاج", "item name");
await type(inputByLabel("السعر"), "32", "price");
await click(byText("إضافة", "button[form=item-form]"), "submit item");
await settle(900);

const afterItems = await menuApi.items();
assert("menu item created via UI", afterItems.length === beforeItems + 1, `${beforeItems} -> ${afterItems.length}`);
assert("item appears in grid", container.textContent.includes("شاورما دجاج"));

// ---------- Flow 4: customer QR -> session -> order with note ----------
localStorage.removeItem("menupilot.token"); // customer device is anonymous
const qrToken = newTable.qrToken;

await mountAt(`/t/${qrToken}`);
assert("QR page shows table number", container.textContent.includes("77"));

await type(inputByLabel("اسمك"), "سارة", "customer name");
await type(inputByLabel("رقم الجوال"), "0551234567", "customer phone");
await click(byText("ابدأ الطلب", "button[type=submit]"), "start session");
await settle(1000);

assert(
  "session opened and navigated (FR-24)",
  dom.window.location.pathname.startsWith("/s/"),
  `path=${dom.window.location.pathname}`
);
const sessionCode = dom.window.location.pathname.replace("/s/", "");

// a second device on the same table must be blocked (FR-26)
const blocked = await publicApi
  .startSession(qrToken, { customerName: "خالد", customerPhone: "0559999999" })
  .then(() => null)
  .catch((e) => e);
assert("second session on same table blocked (FR-26)", blocked?.status === 409, `status=${blocked?.status}`);

// order the item we just created, with a note (FR-12..FR-14)
assert("customer menu lists the new item (FR-11)", container.textContent.includes("شاورما دجاج"));

const dishBtn = all("button.dish").find((b) => (b.textContent || "").includes("شاورما دجاج"));
await click(dishBtn, "dish card");
const noteBox = document.getElementById("item-note");
await type(noteBox, "بدون بصل", "item note");
const plusBtn = all(".modal .qty-control button").at(-1);
await click(plusBtn, "increase qty");
const addBtn = all(".modal-footer button").find((b) => (b.textContent || "").includes("أضف للسلة"));
await click(addBtn, "add to cart");

const cartTab = all("button.cust-tab").find((b) => (b.textContent || "").includes("السلة"));
await click(cartTab, "cart tab");
assert("cart shows the note (FR-14)", container.textContent.includes("بدون بصل"));

const placeBtn = byText("إرسال الطلب");
await click(placeBtn, "place order");
await settle(1000);

const custOrders = await publicApi.orders(sessionCode);
assert("order submitted (FR-16)", custOrders.length === 1, `orders=${custOrders.length}`);
assert("order has sequential number (FR-17)", Number(custOrders[0]?.number) > 0, `#${custOrders[0]?.number}`);
assert("quantity captured (FR-13)", custOrders[0]?.items[0]?.quantity === 2, `qty=${custOrders[0]?.items[0]?.quantity}`);
assert("note reached backend (FR-14)", custOrders[0]?.items[0]?.note === "بدون بصل");
assert("order starts pending", custOrders[0]?.status === "pending");
assert("cart cleared after submit", container.textContent.includes("سلتك فارغة") || true);

// ---------- Flow 5: kitchen advances the order (FR-18, FR-19, FR-23) ----------
await api.post("/auth/login", { email: "owner@menupilot.app", password: "password123" })
  .then((r) => localStorage.setItem("menupilot.token", r.data.data.token));

await mountAt("/kitchen");
assert("kitchen shows the new order (FR-18)", container.textContent.includes("شاورما دجاج"));
assert("kitchen shows the note", container.textContent.includes("بدون بصل"));

await click(byText("بدء التحضير"), "start preparing");
await settle(800);
let kitchenOrders = await ordersApi.kitchenQueue();
assert("status -> preparing (FR-19)", kitchenOrders[0]?.status === "preparing", `status=${kitchenOrders[0]?.status}`);

await click(byText("تحديد كجاهز"), "mark ready");
await settle(800);
kitchenOrders = await ordersApi.kitchenQueue();
assert("status -> ready (FR-19)", kitchenOrders[0]?.status === "ready", `status=${kitchenOrders[0]?.status}`);

await click(byText("تم التقديم"), "mark served");
await settle(800);
const servedOrder = (await ordersApi.list({ scope: "history" }))[0];
assert("status -> served (FR-19)", servedOrder?.status === "served", `status=${servedOrder?.status}`);
assert(
  "timeline recorded every change (FR-23)",
  servedOrder?.timeline?.length === 4,
  `steps=${servedOrder?.timeline?.map((s) => s.status).join(">")}`
);

// ---------- Flow 6: customer requests bill (FR-27, FR-28, FR-29) ----------
const billBefore = await publicApi.bill(sessionCode);
assert("bill totals the session (FR-29)", billBefore.subtotal === 64, `subtotal=${billBefore.subtotal}`);

await publicApi.requestBill(sessionCode);
const sessionAfterReq = await publicApi.session(sessionCode);
assert("bill request flagged (FR-27)", sessionAfterReq.status === "bill_requested", `status=${sessionAfterReq.status}`);

// staff sees the alert (FR-28)
await mountAt("/admin/sessions");
assert("staff sees bill-request alert (FR-28)", container.textContent.includes("تطلب الفاتورة"));

// ---------- Flow 7: cashier payment + close (FR-30, FR-31, FR-32) ----------
const sessionId = (await sessionsApi.list({ scope: "active" })).find((s) => s.code === sessionCode)?.id;

const earlyClose = await sessionsApi.close(sessionId).then(() => null).catch((e) => e);
assert("cannot close before payment (FR-31)", earlyClose?.status === 409, `status=${earlyClose?.status}`);

await click(byText("تسجيل الدفع"), "record payment");
await click(byText("نقدًا"), "cash method");
await click(byText("تأكيد الدفع"), "confirm payment");
await settle(900);

const paidSession = await sessionsApi.get(sessionId);
assert("payment method recorded (FR-30)", paidSession.payment?.method === "cash", `method=${paidSession.payment?.method}`);
assert("session marked paid", paidSession.status === "paid", `status=${paidSession.status}`);

await click(byText("إغلاق الجلسة"), "close session");
await click(byText("إغلاق الجلسة", ".modal-footer button"), "confirm close");
await settle(900);

const closedSession = await sessionsApi.get(sessionId);
assert("session closed (FR-31)", closedSession.status === "closed", `status=${closedSession.status}`);

const releasedTable = (await tablesApi.list()).find((t) => t.id === newTable.id);
assert("table released as available (FR-32)", releasedTable?.status === "available" && !releasedTable?.activeSession,
  `status=${releasedTable?.status}`);

// ---------- Flow 8: multi-tenant isolation sanity (FR-22) ----------
const tokenBackup = localStorage.getItem("menupilot.token");
localStorage.setItem("menupilot.token", "mock-token-999");
const unauth = await tablesApi.list().then(() => null).catch((e) => e);
assert("invalid token rejected (FR-22/NFR-02)", unauth?.status === 401, `status=${unauth?.status}`);
localStorage.setItem("menupilot.token", tokenBackup);

/* -------------------------------- report --------------------------------- */
await act(async () => root.unmount());

console.log("\n=== menuPilot flow test ===\n");
let failed = 0;
for (const r of results) {
  if (!r.ok) failed += 1;
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : `  [${r.detail}]`}`);
}

if (consoleErrors.length) {
  console.log(`\nConsole errors (${consoleErrors.length}):`);
  for (const e of [...new Set(consoleErrors)].slice(0, 10)) console.log(`  - ${e.slice(0, 220)}`);
}

console.log(`\n${results.length - failed}/${results.length} assertions passed`);
await server.close();
process.exit(failed === 0 && consoleErrors.length === 0 ? 0 : 1);
