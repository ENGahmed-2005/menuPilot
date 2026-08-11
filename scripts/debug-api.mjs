import { createServer } from "vite";

const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "error",
  optimizeDeps: { noDiscovery: true, include: [] },
  ssr: { noExternal: ["qrcode.react"] },
});

const { default: api } = await server.ssrLoadModule("/src/api/client.js");
const { default: installMock, resetMockDb } = await server.ssrLoadModule("/src/api/mock/server.js");
installMock(api);
resetMockDb();

const login = await api.post("/auth/login", {
  email: "owner@menupilot.app",
  password: "password123",
});
const token = login.data.data.token;
console.log("login ok, token:", token);

// Directly exercise the endpoints the tables page needs.
for (const url of ["/tables", "/sessions", "/menu/items", "/dashboard/stats"]) {
  const t0 = Date.now();
  try {
    const res = await api.get(url, {
      params: url === "/sessions" ? { scope: "active" } : undefined,
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = res.data.data;
    console.log(
      `OK   ${url.padEnd(18)} ${Date.now() - t0}ms  ${
        Array.isArray(payload) ? `${payload.length} rows` : "object"
      }`
    );
  } catch (e) {
    console.log(`FAIL ${url.padEnd(18)} ${Date.now() - t0}ms  status=${e.status} msg=${e.message}`);
  }
}

await server.close();
process.exit(0);
