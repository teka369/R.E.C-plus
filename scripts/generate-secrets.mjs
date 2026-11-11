import { randomBytes } from "node:crypto";
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function defaultSecretsPath() {
  if (process.platform === "win32") {
    return path.join(os.tmpdir(), "rec-secrets.env");
  }
  return "/tmp/rec-secrets.env";
}

export function assertOutsideRepo(target) {
  const resolved = path.resolve(target);
  const root = path.resolve(repoRoot);
  if (resolved === root || resolved.startsWith(root + path.sep)) {
    throw new Error(`Rechazado: ${resolved} está dentro del repo. Los secretos no se commitean.`);
  }
  return resolved;
}

export function generateSecrets() {
  const secret = (bytes = 48) => randomBytes(bytes).toString("base64url");
  const jwt = secret();
  const refresh = secret();
  const internal = secret(32);
  if (jwt === refresh || jwt.length < 32 || refresh.length < 32) {
    throw new Error("No se pudieron generar secretos distintos de 32+ caracteres");
  }
  return {
    JWT_SECRET: jwt,
    JWT_REFRESH_SECRET: refresh,
    INTERNAL_API_KEY: internal,
  };
}

export function toEnvText(vars) {
  return Object.entries(vars)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")
    .concat("\n");
}

export function writeSecretsFile(target, vars) {
  const resolved = assertOutsideRepo(target);
  mkdirSync(path.dirname(resolved), { recursive: true });
  writeFileSync(resolved, toEnvText(vars), { encoding: "utf8", mode: 0o600 });
  try {
    chmodSync(resolved, 0o600);
  } catch {
    // Windows no aplica el modo Unix; el archivo igual queda fuera del repo.
  }
  return resolved;
}

function parseArgs(argv) {
  const opts = {};
  const flags = new Set();
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
  return { opts, flags };
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(path.resolve(entry)).href;
}

if (isDirectRun()) {
  const { opts, flags } = parseArgs(process.argv.slice(2));
  const vars = generateSecrets();
  if (opts.out) {
    const written = writeSecretsFile(opts.out, vars);
    console.error(`# secretos escritos fuera del repo: ${written}`);
  }
  if (!flags.has("quiet")) {
    console.log("# No guardes esta salida en el repo.");
  }
  process.stdout.write(toEnvText(vars));
}
