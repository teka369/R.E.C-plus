import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export function parseArgs(argv) {
  const flags = new Set();
  const opts = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const body = arg.slice(2);
    if (body.includes("=")) {
      const [key, ...rest] = body.split("=");
      opts[key] = rest.join("=");
      continue;
    }
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      opts[body] = next;
      i += 1;
    } else {
      flags.add(body);
    }
  }
  return { flags, opts, dryRun: flags.has("dry-run") };
}

export function log(message) {
  console.log(message);
}

export function redact(value) {
  if (value == null || value === "") return "(vacío)";
  return `***len=${String(value).length}`;
}

export function requireEnv(name, dryRun) {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (dryRun) return "";
  throw new Error(`Falta ${name}. Expórtala en el entorno; no la pongas en el repo.`);
}

export function gitBranch() {
  const result = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  const branch = result.stdout?.trim();
  return branch || "main";
}

export async function api(method, url, { token, body, dryRun, label }) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = "Bearer ***";
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (dryRun) {
    log(`[dry-run] ${method} ${url}${label ? ` (${label})` : ""}`);
    if (body !== undefined) {
      log(`[dry-run] body ${safeBodyPreview(body)}`);
    }
    return { dryRun: true, status: 0, json: null };
  }
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text.slice(0, 500) };
    }
  }
  if (!response.ok) {
    const detail = json?.message || json?.error || text.slice(0, 400);
    throw new Error(`${method} ${url} → ${response.status} ${detail}`);
  }
  return { dryRun: false, status: response.status, json };
}

function safeBodyPreview(body) {
  const clone = JSON.parse(JSON.stringify(body));
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      if (/secret|password|token|key|url|uri|database/i.test(key) && typeof value === "string") {
        node[key] = redact(value);
      } else if (value && typeof value === "object") {
        walk(value);
      }
    }
  };
  walk(clone);
  return JSON.stringify(clone);
}

export function withQuery(base, params) {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
