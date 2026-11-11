import { parseArgs, log, api, requireEnv, gitBranch, redact, sleep, withQuery } from "./lib.mjs";

const API = "https://api.render.com/v1";

export const BUILD_COMMAND = "npm ci --include=dev && npx prisma generate && npm run build";
export const START_COMMAND = "npm run start:render";

export function renderEnvVars({ databaseUrl, directUrl, secrets, frontendUrl }) {
  const origin = frontendUrl || process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "";
  const vars = [
    ["NODE_ENV", "production"],
    ["TRUST_PROXY", "1"],
    ["DATABASE_URL", databaseUrl],
    ["DATABASE_DIRECT_URL", directUrl],
    ["JWT_SECRET", secrets.JWT_SECRET],
    ["JWT_REFRESH_SECRET", secrets.JWT_REFRESH_SECRET],
    ["JWT_EXPIRES", "15m"],
    ["JWT_REFRESH_EXPIRES", "30d"],
    ["JWT_ISSUER", "recedu"],
    ["JWT_AUDIENCE", "recedu-app"],
    ["INTERNAL_API_KEY", secrets.INTERNAL_API_KEY],
    ["CORS_ORIGIN", origin],
    ["EMBED_ORIGINS", origin],
    ["FRONTEND_URL", origin],
  ];
  if (process.env.RESEND_API_KEY) vars.push(["RESEND_API_KEY", process.env.RESEND_API_KEY]);
  if (process.env.RESEND_FROM) vars.push(["RESEND_FROM", process.env.RESEND_FROM]);
  return vars
    .filter(([, value]) => value)
    .map(([key, value]) => ({ key, value }));
}

function serviceIdOf(item) {
  return item?.service?.id || item?.id || null;
}

function serviceNameOf(item) {
  return item?.service?.name || item?.name || "";
}

function serviceUrlOf(item) {
  return (
    item?.service?.serviceDetails?.url ||
    item?.serviceDetails?.url ||
    item?.service?.url ||
    ""
  );
}

export async function ensureRenderService({ dryRun, name, envVars, repo, branch, ownerId }) {
  const token = requireEnv("RENDER_API_KEY", dryRun);
  const serviceName = name || process.env.RENDER_SERVICE_NAME || "rec-backend";
  const gitRepo = repo || process.env.RENDER_REPO || "https://github.com/teka369/R.E.C-plus";
  const gitBranchName = branch || process.env.RENDER_BRANCH || gitBranch();
  const owner = ownerId || process.env.RENDER_OWNER_ID || "";

  if (dryRun) {
    log("[dry-run] render: no se llama a la API");
    log(`[dry-run] GET ${API}/services?name=${serviceName}`);
    log(`[dry-run] si no existe: POST ${API}/services type=web_service rootDir=r.e.c-backend`);
    log(`[dry-run] build=${BUILD_COMMAND}`);
    log(`[dry-run] start=${START_COMMAND} health=/health branch=${gitBranchName}`);
    log(`[dry-run] PUT env-vars keys=${envVars.map((item) => item.key).join(",")}`);
    log("[dry-run] POST /services/{id}/deploys");
    return {
      id: "srv-dry-run",
      url: process.env.RENDER_SERVICE_URL || "https://rec-backend.onrender.com",
      dryRun: true,
    };
  }

  let resolvedOwner = owner;
  if (!resolvedOwner) {
    const owners = await api("GET", `${API}/owners`, { token, label: "owners" });
    const first = Array.isArray(owners.json) ? owners.json[0] : null;
    resolvedOwner = first?.owner?.id || first?.id || "";
    if (!resolvedOwner) throw new Error("No se pudo resolver RENDER_OWNER_ID. Expórtalo.");
  }

  const listed = await api("GET", withQuery(`${API}/services`, { name: serviceName, limit: 20 }), {
    token,
    label: "list services",
  });
  const items = Array.isArray(listed.json) ? listed.json : [];
  const found = items.find((item) => serviceNameOf(item) === serviceName);
  let id = serviceIdOf(found);
  let url = serviceUrlOf(found);

  if (!id) {
    const created = await api("POST", `${API}/services`, {
      token,
      label: "create service",
      body: {
        type: "web_service",
        name: serviceName,
        ownerId: resolvedOwner,
        repo: gitRepo,
        autoDeploy: "yes",
        branch: gitBranchName,
        rootDir: "r.e.c-backend",
        serviceDetails: {
          env: "node",
          plan: process.env.RENDER_PLAN || "starter",
          region: process.env.RENDER_REGION || "oregon",
          healthCheckPath: "/health",
          pullRequestPreviewsEnabled: "no",
          envSpecificDetails: {
            buildCommand: BUILD_COMMAND,
            startCommand: START_COMMAND,
          },
        },
      },
    });
    const service = created.json?.service || created.json;
    id = service?.id;
    url = service?.serviceDetails?.url || url;
    if (!id) throw new Error("Render no devolvió el id del servicio");
    log(`[render] servicio creado: ${id}`);
  } else {
    log(`[render] servicio existente: ${id}`);
  }

  await api("PUT", `${API}/services/${id}/env-vars`, {
    token,
    label: "env vars",
    body: envVars,
  });
  await api("POST", `${API}/services/${id}/deploys`, {
    token,
    label: "deploy",
    body: { clearCache: "do_not_clear" },
  });
  if (!url) url = `https://${serviceName}.onrender.com`;
  log(`[render] URL ${url}`);
  return { id, url, dryRun: false };
}

export async function updateRenderCors({ dryRun, serviceId, frontendUrl, databaseUrl, directUrl, secrets }) {
  const token = requireEnv("RENDER_API_KEY", dryRun);
  const envVars = renderEnvVars({ databaseUrl, directUrl, secrets, frontendUrl });
  if (dryRun) {
    log(`[dry-run] actualizar CORS/FRONTEND_URL a ${frontendUrl} y redeploy ${serviceId || "srv-dry-run"}`);
    log(`[dry-run] keys=${envVars.map((item) => item.key).join(",")}`);
    return;
  }
  if (!serviceId) throw new Error("Falta el id del servicio Render para actualizar CORS");
  await api("PUT", `${API}/services/${serviceId}/env-vars`, {
    token,
    label: "update cors",
    body: envVars,
  });
  await api("POST", `${API}/services/${serviceId}/deploys`, {
    token,
    label: "redeploy after cors",
    body: { clearCache: "do_not_clear" },
  });
}

export async function waitForHealth(baseUrl, { dryRun, attempts = 30, delayMs = 10000 } = {}) {
  const url = `${baseUrl.replace(/\/$/, "")}/health`;
  if (dryRun) {
    log(`[dry-run] poll ${url} hasta ${attempts} veces cada ${delayMs}ms, esperando HTTP 200`);
    return true;
  }
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      log(`[health] intento ${attempt}/${attempts} → ${response.status}`);
      if (response.status === 200) return true;
    } catch (error) {
      log(`[health] intento ${attempt}/${attempts} sin respuesta (${error.message})`);
    }
    if (attempt < attempts) await sleep(delayMs);
  }
  throw new Error(`Health check no respondió 200: ${url}`);
}

async function main() {
  const { opts, dryRun } = parseArgs(process.argv.slice(2));
  const secrets = {
    JWT_SECRET: process.env.JWT_SECRET || "dry-run-jwt-secret-not-real",
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "dry-run-refresh-secret-not-real",
    INTERNAL_API_KEY: process.env.INTERNAL_API_KEY || "dry-run-internal-key",
  };
  const envVars = renderEnvVars({
    databaseUrl: process.env.DATABASE_URL || "postgresql://USER:CHANGE_ME@ep-dry-run-pooler.neon.tech/neondb?sslmode=require",
    directUrl: process.env.DATABASE_DIRECT_URL || "postgresql://USER:CHANGE_ME@ep-dry-run.neon.tech/neondb?sslmode=require",
    secrets,
    frontendUrl: opts["frontend-url"] || process.env.FRONTEND_URL || "",
  });
  const service = await ensureRenderService({ dryRun, envVars, name: opts.name });
  if (opts["wait-health"]) {
    await waitForHealth(service.url, { dryRun });
  }
  log(`[render] service ${service.id} url=${service.url} jwt=${redact(secrets.JWT_SECRET)}`);
}

if ((process.argv[1] || "").endsWith("render.mjs")) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}
