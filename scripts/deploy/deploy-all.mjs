import { readFileSync, existsSync } from "node:fs";
import { parseArgs, log, redact } from "./lib.mjs";
import { defaultSecretsPath, generateSecrets, writeSecretsFile } from "../generate-secrets.mjs";
import { resolveNeon } from "./neon.mjs";
import { ensureRenderService, renderEnvVars, updateRenderCors, waitForHealth } from "./render.mjs";
import { deployVercel } from "./vercel.mjs";

function loadEnvFile(file) {
  if (!file || !existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("=");
    out[line.slice(0, index)] = line.slice(index + 1);
  }
  return out;
}

async function main() {
  const { flags, opts, dryRun } = parseArgs(process.argv.slice(2));
  const secretsPath = opts.out || process.env.REC_SECRETS_FILE || defaultSecretsPath();
  const previous = loadEnvFile(secretsPath);

  const secrets = {
    JWT_SECRET: process.env.JWT_SECRET || previous.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || previous.JWT_REFRESH_SECRET,
    INTERNAL_API_KEY: process.env.INTERNAL_API_KEY || previous.INTERNAL_API_KEY,
  };
  if (!secrets.JWT_SECRET || flags.has("rotate-secrets") || (!previous.JWT_SECRET && !process.env.JWT_SECRET)) {
    const fresh = generateSecrets();
    Object.assign(secrets, fresh);
    log("[secrets] generados en memoria (no se imprimen)");
  }
  if (!dryRun) {
    writeSecretsFile(secretsPath, {
      ...previous,
      ...secrets,
    });
    log(`[secrets] archivo fuera del repo: ${secretsPath}`);
  } else {
    log(`[dry-run] secretos jwt=${redact(secrets.JWT_SECRET)} refresh=${redact(secrets.JWT_REFRESH_SECRET)}`);
    log(`[dry-run] no se escribe ${secretsPath}`);
  }

  let databaseUrl = process.env.DATABASE_URL || previous.DATABASE_URL || "";
  let directUrl = process.env.DATABASE_DIRECT_URL || previous.DATABASE_DIRECT_URL || "";
  if (!flags.has("skip-neon")) {
    const neon = await resolveNeon({ dryRun, out: secretsPath });
    databaseUrl = neon.databaseUrl;
    directUrl = neon.directUrl;
    if (!dryRun) {
      writeSecretsFile(secretsPath, {
        ...loadEnvFile(secretsPath),
        ...secrets,
        DATABASE_URL: databaseUrl,
        DATABASE_DIRECT_URL: directUrl,
      });
    }
  } else {
    log("[neon] omitido (--skip-neon)");
    if (!databaseUrl || !directUrl) {
      databaseUrl = databaseUrl || "postgresql://USER:CHANGE_ME@ep-skip-pooler.neon.tech/neondb?sslmode=require";
      directUrl = directUrl || "postgresql://USER:CHANGE_ME@ep-skip.neon.tech/neondb?sslmode=require";
      if (!dryRun) throw new Error("--skip-neon requiere DATABASE_URL y DATABASE_DIRECT_URL");
    }
  }

  let render = { id: process.env.RENDER_SERVICE_ID || "", url: process.env.RENDER_SERVICE_URL || "" };
  if (!flags.has("skip-render")) {
    const envVars = renderEnvVars({
      databaseUrl,
      directUrl,
      secrets,
      frontendUrl: process.env.FRONTEND_URL || "",
    });
    render = await ensureRenderService({ dryRun, envVars });
    await waitForHealth(render.url, { dryRun });
  } else {
    log("[render] omitido (--skip-render)");
  }

  let frontendUrl = process.env.FRONTEND_URL || "";
  if (!flags.has("skip-vercel")) {
    if (!render.url && !dryRun) {
      throw new Error("Vercel necesita la URL de Render (RENDER_SERVICE_URL o un deploy previo)");
    }
    const vercel = await deployVercel({
      dryRun,
      renderUrl: render.url || "https://rec-backend.onrender.com",
      jwtSecret: secrets.JWT_SECRET,
    });
    frontendUrl = vercel.url;
  } else {
    log("[vercel] omitido (--skip-vercel)");
  }

  if (!flags.has("skip-render") && frontendUrl) {
    await updateRenderCors({
      dryRun,
      serviceId: render.id,
      frontendUrl,
      databaseUrl,
      directUrl,
      secrets,
    });
    await waitForHealth(render.url, { dryRun, attempts: 20 });
  }

  log("--- resumen ---");
  log(`backend: ${render.url || "(no desplegado)"}`);
  log(`frontend: ${frontendUrl || "(no desplegado)"}`);
  log(`health: ${(render.url || "").replace(/\/$/, "")}/health`);
  log("SESSION_COOKIE_DOMAIN no se define.");
  log("Los secretos no se imprimieron ni se escribieron en el repo.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
