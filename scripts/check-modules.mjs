/**
 * Dev-server smoke check: crawls the ESM module graph starting at
 * /src/main.jsx and reports any module Vite fails to transform.
 *
 * Usage: node scripts/check-modules.mjs [baseUrl]
 */
const base = (process.argv[2] || "http://localhost:5174").replace(/\/$/, "");

const seen = new Set();
const failures = [];
let checked = 0;

const IMPORT_RE = /(?:^|[\s;(])(?:import|export)[\s\S]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|import\s*["']([^"']+)["']/g;

function resolve(spec, fromPath) {
  if (!spec.startsWith(".")) return null; // bare / already-absolute deps
  const fromDir = fromPath.slice(0, fromPath.lastIndexOf("/"));
  const parts = `${fromDir}/${spec}`.split("/");
  const stack = [];
  for (const part of parts) {
    if (part === "." || part === "") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return `/${stack.join("/")}`;
}

async function visit(path) {
  if (seen.has(path)) return;
  seen.add(path);

  let res;
  try {
    res = await fetch(base + path);
  } catch (err) {
    failures.push({ path, status: "FETCH_FAILED", detail: err.message });
    return;
  }

  const body = await res.text();
  checked += 1;

  if (!res.ok) {
    failures.push({ path, status: res.status, detail: body.slice(0, 400) });
    return;
  }
  if (/^\s*<!doctype/i.test(body) && path.endsWith(".jsx")) {
    failures.push({ path, status: "HTML_FALLBACK", detail: "module not resolved" });
    return;
  }

  if (path.endsWith(".css")) return;

  const specs = new Set();
  for (const m of body.matchAll(IMPORT_RE)) {
    const spec = m[1] || m[2] || m[3];
    if (spec) specs.add(spec);
  }

  for (const spec of specs) {
    if (spec.startsWith("/src/")) {
      await visit(spec);
    } else if (spec.startsWith(".")) {
      const resolved = resolve(spec, path);
      if (resolved) await visit(resolved);
    }
  }
}

await visit("/src/main.jsx");

console.log(`checked ${checked} modules from ${base}`);
if (failures.length === 0) {
  console.log("OK: every module transformed successfully");
} else {
  console.log(`FAILURES: ${failures.length}`);
  for (const f of failures) {
    console.log(`\n--- ${f.path} [${f.status}]\n${f.detail}`);
  }
  process.exitCode = 1;
}
