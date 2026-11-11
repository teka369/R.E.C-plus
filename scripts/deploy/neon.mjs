import { parseArgs, log, api, requireEnv, withQuery, redact } from "./lib.mjs";
import { defaultSecretsPath, writeSecretsFile } from "../generate-secrets.mjs";

const API = "https://console.neon.tech/api/v2";

function ensureSsl(uri, { pooled }) {
  const url = new URL(uri);
  if (!url.searchParams.has("sslmode")) url.searchParams.set("sslmode", "require");
  if (pooled) {
    if (!url.searchParams.has("pgbouncer")) url.searchParams.set("pgbouncer", "true");
    if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "15");
  }
  return url.toString();
}

function pickUri(payload) {
  return (
    payload?.uri ||
    payload?.connection_uri ||
    payload?.connection_uris?.[0]?.connection_uri ||
    payload?.connection_uris?.[0]?.connection_uri_pooled ||
    null
  );
}

export async function resolveNeon({ dryRun, name, region, out }) {
  const existingUrl = process.env.DATABASE_URL?.trim();
  const existingDirect = process.env.DATABASE_DIRECT_URL?.trim();
  if (existingUrl && existingDirect) {
    log(`[neon] usando DATABASE_URL y DATABASE_DIRECT_URL del entorno (${redact(existingUrl)})`);
    return {
      databaseUrl: ensureSsl(existingUrl, { pooled: true }),
      directUrl: ensureSsl(existingDirect, { pooled: false }),
      created: false,
    };
  }

  const token = requireEnv("NEON_API_KEY", dryRun);
  const projectName = name || process.env.NEON_PROJECT_NAME || "rec-plus";
  const regionId = region || process.env.NEON_REGION || "aws-us-east-2";

  if (dryRun) {
    log("[dry-run] neon: no se llama a la API");
    log(`[dry-run] GET ${API}/projects?limit=100  (buscar name=${projectName})`);
    log(`[dry-run] si no existe: POST ${API}/projects region_id=${regionId}`);
    log("[dry-run] GET /projects/{id}/connection_uri?pooled=true y pooled=false");
    log(`[dry-run] escribiría DATABASE_URL/DATABASE_DIRECT_URL en ${out || defaultSecretsPath()} (fuera del repo)`);
    return {
      databaseUrl: "postgresql://USER:CHANGE_ME@ep-dry-run-pooler.neon.tech/neondb?sslmode=require&pgbouncer=true",
      directUrl: "postgresql://USER:CHANGE_ME@ep-dry-run.neon.tech/neondb?sslmode=require",
      created: false,
      dryRun: true,
    };
  }

  const listed = await api("GET", withQuery(`${API}/projects`, { limit: 100 }), {
    token,
    label: "list projects",
  });
  const projects = listed.json?.projects || listed.json || [];
  let project = projects.find((item) => item.name === projectName);

  if (!project) {
    const created = await api("POST", `${API}/projects`, {
      token,
      label: "create project",
      body: { project: { name: projectName, region_id: regionId } },
    });
    project = created.json?.project || created.json;
    log(`[neon] proyecto creado: ${project?.id || projectName}`);
  } else {
    log(`[neon] proyecto existente: ${project.id}`);
  }

  const projectId = project.id;
  const role =
    project.roles?.[0]?.name ||
    process.env.NEON_ROLE ||
    "neondb_owner";
  const database = process.env.NEON_DATABASE || "neondb";

  const pooled = await api(
    "GET",
    withQuery(`${API}/projects/${projectId}/connection_uri`, {
      database_name: database,
      role_name: role,
      pooled: "true",
    }),
    { token, label: "pooled uri" },
  );
  const direct = await api(
    "GET",
    withQuery(`${API}/projects/${projectId}/connection_uri`, {
      database_name: database,
      role_name: role,
      pooled: "false",
    }),
    { token, label: "direct uri" },
  );

  const databaseUrl = ensureSsl(pickUri(pooled.json), { pooled: true });
  const directUrl = ensureSsl(pickUri(direct.json), { pooled: false });
  if (!databaseUrl || !directUrl) {
    throw new Error("Neon no devolvió las dos connection strings");
  }
  return { databaseUrl, directUrl, projectId, created: true };
}

async function main() {
  const { opts, dryRun } = parseArgs(process.argv.slice(2));
  const result = await resolveNeon({
    dryRun,
    name: opts.name,
    region: opts.region,
    out: opts.out,
  });
  const target = opts.out || defaultSecretsPath();
  if (!dryRun) {
    writeSecretsFile(target, {
      DATABASE_URL: result.databaseUrl,
      DATABASE_DIRECT_URL: result.directUrl,
      ...(result.projectId ? { NEON_PROJECT_ID: result.projectId } : {}),
    });
    log(`[neon] URLs escritas fuera del repo: ${target}`);
  }
  log(`[neon] DATABASE_URL ${redact(result.databaseUrl)}`);
  log(`[neon] DATABASE_DIRECT_URL ${redact(result.directUrl)}`);
}

const entry = process.argv[1] || "";
if (entry.endsWith("neon.mjs")) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}
