#!/usr/bin/env node
// Dev-server smoke test: `npm run smoke:dev`
//
// Starts the Vite dev server, loads a few routes in headless Chrome, and fails
// if the app doesn't mount (#root empty) or any same-origin module request
// fails. This catches dev-only breakage that `npm run build` and the unit
// tests cannot see — e.g. the Vite /api proxy swallowing a source import.
//
// No extra dependencies: drives the locally installed Chrome over the
// DevTools protocol using Node's built-in fetch + WebSocket (Node 22+).
// Set CHROME_PATH to override Chrome discovery.

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const ROUTES = ["/", "/admin"];
const VITE_PORT = Number(process.env.SMOKE_PORT || 8095);
const CDP_PORT = Number(process.env.SMOKE_CDP_PORT || 9333);
const ORIGIN = `http://localhost:${VITE_PORT}`;
const MOUNT_TIMEOUT_MS = 30_000;
const SETTLE_MS = 1_500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p));
}

function killTree(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    try { process.kill(-child.pid, "SIGKILL"); } catch { try { child.kill("SIGKILL"); } catch {} }
  }
}

async function waitFor(fn, timeoutMs, label) {
  const start = Date.now();
  for (;;) {
    try {
      const v = await fn();
      if (v) return v;
    } catch {}
    if (Date.now() - start > timeoutMs) throw new Error(`timed out waiting for ${label}`);
    await sleep(250);
  }
}

// Minimal CDP session over one page target's WebSocket.
function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let nextId = 1;
    const pending = new Map();
    const listeners = new Set();
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      } else if (msg.method) {
        for (const l of listeners) l(msg);
      }
    };
    ws.onerror = () => reject(new Error(`CDP websocket error (${wsUrl})`));
    ws.onopen = () =>
      resolve({
        send: (method, params = {}) =>
          new Promise((res, rej) => {
            const id = nextId++;
            pending.set(id, { res, rej });
            ws.send(JSON.stringify({ id, method, params }));
          }),
        on: (fn) => listeners.add(fn),
        close: () => ws.close(),
      });
  });
}

async function checkRoute(route) {
  const failures = [];
  const warnings = [];

  const target = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: "PUT" })).json();
  const cdp = await connect(target.webSocketDebuggerUrl);

  const requests = new Map(); // requestId -> { url, type }
  cdp.on(({ method, params }) => {
    if (method === "Network.requestWillBeSent") {
      requests.set(params.requestId, { url: params.request.url, type: params.type });
    } else if (method === "Network.responseReceived") {
      const { url, status } = params.response;
      if (params.type === "Script" && url.startsWith(ORIGIN) && status >= 400) {
        failures.push(`module ${status}: ${url.slice(ORIGIN.length)}`);
      }
    } else if (method === "Network.loadingFailed") {
      const req = requests.get(params.requestId);
      if (req && req.type === "Script" && req.url.startsWith(ORIGIN) && !params.canceled) {
        failures.push(`module failed (${params.errorText}): ${req.url.slice(ORIGIN.length)}`);
      }
    } else if (method === "Runtime.exceptionThrown") {
      const d = params.exceptionDetails;
      warnings.push(`uncaught: ${d.exception?.description?.split("\n")[0] ?? d.text}`);
    } else if (method === "Runtime.consoleAPICalled" && params.type === "error") {
      warnings.push(`console.error: ${params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200)}`);
    }
  });

  await cdp.send("Network.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");
  await cdp.send("Page.navigate", { url: ORIGIN + route });

  const rootChildren = async () => {
    const { result } = await cdp.send("Runtime.evaluate", {
      expression: "document.getElementById('root')?.childElementCount ?? -1",
      returnByValue: true,
    });
    return result.value;
  };

  let mounted = false;
  try {
    mounted = !!(await waitFor(async () => (await rootChildren()) > 0, MOUNT_TIMEOUT_MS, "#root to mount"));
  } catch {
    mounted = false;
  }
  await sleep(SETTLE_MS); // let late module requests settle so failures are caught
  if (!mounted || (await rootChildren()) <= 0) failures.push("#root is empty — app did not mount");

  cdp.close();
  await fetch(`http://127.0.0.1:${CDP_PORT}/json/close/${target.id}`).catch(() => {});
  return { failures, warnings };
}

async function main() {
  const chromePath = findChrome();
  if (!chromePath) {
    console.error("smoke:dev — Chrome not found. Set CHROME_PATH to a Chrome/Chromium binary.");
    process.exit(2);
  }

  let vite;
  let chrome;
  const profileDir = mkdtempSync(path.join(tmpdir(), "smoke-dev-"));
  const cleanup = () => {
    killTree(chrome);
    killTree(vite);
    try { rmSync(profileDir, { recursive: true, force: true }); } catch {}
  };
  process.on("SIGINT", () => { cleanup(); process.exit(130); });

  let exitCode = 0;
  try {
    console.log(`▶ smoke:dev — starting Vite on :${VITE_PORT}`);
    vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--port", String(VITE_PORT), "--strictPort"], {
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
    });
    let viteLog = "";
    vite.stdout.on("data", (d) => { viteLog += d; });
    vite.stderr.on("data", (d) => { viteLog += d; });
    await waitFor(async () => (await fetch(ORIGIN + "/")).ok, 60_000, "Vite dev server").catch((e) => {
      console.error(viteLog);
      throw e;
    });

    chrome = spawn(
      chromePath,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        `--remote-debugging-port=${CDP_PORT}`,
        `--user-data-dir=${profileDir}`,
        "about:blank",
      ],
      { stdio: "ignore", detached: process.platform !== "win32" }
    );
    await waitFor(async () => (await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)).ok, 30_000, "Chrome DevTools");

    for (const route of ROUTES) {
      const { failures, warnings } = await checkRoute(route);
      if (failures.length) {
        exitCode = 1;
        console.log(`✗ ${route}`);
        for (const f of failures) console.log(`    FAIL  ${f}`);
      } else {
        console.log(`✓ ${route}`);
      }
      for (const w of [...new Set(warnings)]) console.log(`    warn  ${w}`);
    }
  } catch (err) {
    console.error(`✗ smoke:dev — ${err.message}`);
    exitCode = 1;
  } finally {
    cleanup();
  }

  console.log(exitCode === 0 ? "✓ smoke:dev passed" : "✗ smoke:dev failed");
  process.exit(exitCode);
}

main();
