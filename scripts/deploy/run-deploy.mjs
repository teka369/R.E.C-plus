import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { parseArgs, repoRoot } from "./lib.mjs";
import { assertOutsideRepo } from "../generate-secrets.mjs";

const MIN_LENGTH = 20;
const KEYS = [
  {
    env: "NEON_API_KEY",
    flag: "neon-api-key",
    label: "Neon API key",
  },
  {
    env: "RENDER_API_KEY",
    flag: "render-api-key",
    label: "Render API key",
  },
  {
    env: "VERCEL_TOKEN",
    flag: "vercel-token",
    label: "Vercel token",
  },
];

function loadKeysFile(file) {
  const resolved = assertOutsideRepo(file);
  if (!existsSync(resolved)) {
    throw new Error(`No existe el archivo de keys: ${resolved}`);
  }
  const out = {};
  for (const line of readFileSync(resolved, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("=");
    out[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return out;
}

function promptHidden(question) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    const output = process.stdout;
    if (!input.isTTY) {
      reject(new Error("terminal no interactiva"));
      return;
    }
    output.write(question);
    const wasRaw = input.isRaw;
    if (typeof input.setRawMode === "function") input.setRawMode(true);
    let value = "";
    const onData = (chunk) => {
      const text = chunk.toString("utf8");
      for (const char of text) {
        if (char === "\u0003") {
          cleanup();
          reject(new Error("cancelado"));
          return;
        }
        if (char === "\r" || char === "\n") {
          cleanup();
          output.write("\n");
          resolve(value.trim());
          return;
        }
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        value += char;
      }
    };
    const cleanup = () => {
      input.removeListener("data", onData);
      if (typeof input.setRawMode === "function") input.setRawMode(Boolean(wasRaw));
    };
    input.on("data", onData);
  });
}

async function promptVisible(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(question);
    return answer.trim();
  } finally {
    rl.close();
  }
}

async function ask(label) {
  const question = `${label} (no se guarda en el repo): `;
  try {
    return await promptHidden(question);
  } catch (error) {
    if (error.message === "cancelado") throw error;
    console.error("No se pudo ocultar la entrada. Se pedirá en texto visible.");
    return promptVisible(question);
  }
}

function validate(name, value) {
  if (!value || value.trim().length < MIN_LENGTH) {
    throw new Error(`${name} está vacía o tiene menos de ${MIN_LENGTH} caracteres`);
  }
  return value.trim();
}

async function collectKeys(opts) {
  const fromFile = opts["keys-file"] ? loadKeysFile(opts["keys-file"]) : {};
  const collected = {};
  for (const key of KEYS) {
    const fromFlag = opts[key.flag];
    const fromEnv = process.env[key.env];
    const fromDisk = fromFile[key.env];
    let value = fromFlag || fromEnv || fromDisk || "";
    if (!value) {
      if (!process.stdin.isTTY) {
        throw new Error(
          `Falta ${key.env}. Pásala por entorno, --${key.flag} o ejecuta el script en una terminal interactiva.`,
        );
      }
      console.log(`Falta ${key.env}.`);
      value = await ask(key.label);
    }
    collected[key.env] = validate(key.env, value);
  }
  return collected;
}

function forwardArgs(argv) {
  const blocked = new Set(["neon-api-key", "render-api-key", "vercel-token", "keys-file"]);
  const out = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      out.push(arg);
      continue;
    }
    const name = arg.slice(2).split("=")[0];
    if (blocked.has(name)) {
      if (!arg.includes("=") && argv[i + 1] && !argv[i + 1].startsWith("--")) i += 1;
      continue;
    }
    out.push(arg);
    if (!arg.includes("=") && argv[i + 1] && !argv[i + 1].startsWith("--")) {
      out.push(argv[i + 1]);
      i += 1;
    }
  }
  return out;
}

function runDeployAll(args, env) {
  const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "deploy-all.mjs");
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: repoRoot,
      stdio: "inherit",
      env,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`deploy-all terminó con código ${code ?? 1}`));
    });
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const { opts, dryRun } = parseArgs(argv);
  console.log(dryRun ? "Modo dry-run. No se llamará a Neon, Render ni Vercel." : "Deploy real de R.E.C-plus.");
  const keys = await collectKeys(opts);
  console.log("Keys recibidas. No se muestran ni se escriben en el repo.");
  console.log("Siguiente paso: generar secretos de app, Neon, Render, health y Vercel.");
  await runDeployAll(forwardArgs(argv), {
    ...process.env,
    ...keys,
  });
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
