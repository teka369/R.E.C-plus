import { parseArgs, log, api, requireEnv, gitBranch, redact, withQuery } from "./lib.mjs";

const API = "https://api.vercel.com";

export function vercelEnv(renderUrl, jwtSecret) {
  const apiUrl = renderUrl.replace(/\/$/, "");
  return [
    {
      key: "NEXT_PUBLIC_API_BASE_URL",
      value: apiUrl,
      type: "plain",
      target: ["production", "preview", "development"],
    },
    {
      key: "INTERNAL_API_URL",
      value: apiUrl,
      type: "plain",
      target: ["production", "preview", "development"],
    },
    {
      key: "JWT_SECRET",
      value: jwtSecret,
      type: "encrypted",
      target: ["production", "preview", "development"],
    },
    {
      key: "TRUST_PROXY_HEADERS",
      value: "1",
      type: "plain",
      target: ["production", "preview", "development"],
    },
    {
      key: "NEXT_PUBLIC_SITE_URL",
      value: process.env.NEXT_PUBLIC_SITE_URL || "",
      type: "plain",
      target: ["production"],
    },
  ].filter((item) => item.value);
}

function projectIdOf(payload) {
  return payload?.id || payload?.project?.id || payload?.projectId || "";
}

export async function deployVercel({ dryRun, renderUrl, jwtSecret, projectName }) {
  const token = requireEnv("VERCEL_TOKEN", dryRun);
  const name = projectName || process.env.VERCEL_PROJECT_NAME || "rec-frontend";
  const team = process.env.VERCEL_ORG_ID || process.env.VERCEL_TEAM_ID || "";
  const branch = process.env.VERCEL_GIT_BRANCH || gitBranch();
  const repo = process.env.VERCEL_GIT_REPO || "teka369/R.E.C-plus";
  const env = vercelEnv(renderUrl, jwtSecret);

  if (dryRun) {
    log("[dry-run] vercel: no se llama a la API ni se define SESSION_COOKIE_DOMAIN");
    log(`[dry-run] proyecto=${name} rootDirectory=r.e.c-frontend framework=nextjs`);
    log(`[dry-run] env keys=${env.map((item) => item.key).join(",")}`);
    log(`[dry-run] JWT_SECRET ${redact(jwtSecret)} (el mismo del backend)`);
    log(`[dry-run] deploy git ${repo}@${branch} target=production`);
    return {
      projectId: process.env.VERCEL_PROJECT_ID || "prj-dry-run",
      url: process.env.VERCEL_URL || "https://rec-frontend.vercel.app",
      dryRun: true,
    };
  }

  const query = team ? { teamId: team } : {};
  let projectId = process.env.VERCEL_PROJECT_ID || "";
  if (!projectId) {
    const created = await api("POST", withQuery(`${API}/v10/projects`, query), {
      token,
      label: "create project",
      body: {
        name,
        framework: "nextjs",
        rootDirectory: "r.e.c-frontend",
      },
    });
    projectId = projectIdOf(created.json);
    if (!projectId) throw new Error("Vercel no devolvió project id");
    log(`[vercel] proyecto creado: ${projectId}`);
  } else {
    log(`[vercel] proyecto existente: ${projectId}`);
  }

  await api("POST", withQuery(`${API}/v10/projects/${projectId}/env`, { ...query, upsert: "true" }), {
    token,
    label: "env",
    body: env,
  });

  const [org, repoName] = repo.split("/");
  const deployment = await api("POST", withQuery(`${API}/v13/deployments`, query), {
    token,
    label: "deployment",
    body: {
      name,
      project: projectId,
      target: "production",
      gitSource: {
        type: "github",
        org,
        repo: repoName,
        ref: branch,
      },
    },
  });
  const alias = deployment.json?.alias?.[0];
  const host = alias || deployment.json?.url;
  const url = host ? (host.startsWith("http") ? host : `https://${host}`) : "";
  if (!url) throw new Error("Vercel no devolvió la URL del deployment");
  log(`[vercel] URL ${url}`);
  return { projectId, url, dryRun: false };
}

async function main() {
  const { opts, dryRun } = parseArgs(process.argv.slice(2));
  const renderUrl = opts["render-url"] || process.env.RENDER_SERVICE_URL || "https://rec-backend.onrender.com";
  const jwt = process.env.JWT_SECRET || "dry-run-jwt-secret-not-real";
  const result = await deployVercel({
    dryRun,
    renderUrl,
    jwtSecret: jwt,
    projectName: opts.name,
  });
  log(`[vercel] project=${result.projectId} url=${result.url}`);
}

if ((process.argv[1] || "").endsWith("vercel.mjs")) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}
