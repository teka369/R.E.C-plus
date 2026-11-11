import { execFileSync } from "node:child_process";

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);

let fail = 0;

function allowedEnv(path) {
  return (
    path.endsWith(".example") ||
    path.endsWith(".env.example") ||
    path.endsWith(".env.coolify.example") ||
    /\.env\.[^/]+\.example$/.test(path)
  );
}

for (const path of tracked) {
  const base = path.split("/").pop() ?? path;
  if (
    base === ".env" ||
    base === ".env.local" ||
    base === ".env.test" ||
    base === ".env.production" ||
    base === ".env.development" ||
    base === ".env.docker"
  ) {
    console.error(`BLOCK tracked env file: ${path}`);
    fail = 1;
  } else if (base.startsWith(".env.") && !allowedEnv(path)) {
    console.error(`BLOCK tracked env file: ${path}`);
    fail = 1;
  }
  if (
    path.startsWith("r.e.c-backend/uploads/") ||
    path.includes("/uploads/study-materials/")
  ) {
    console.error(`BLOCK tracked user upload: ${path}`);
    fail = 1;
  }
}

const skipContent = (path) =>
  /\.(png|jpe?g|gif|webp|pdf|lock|tsbuildinfo)$/i.test(path) ||
  path.endsWith(".example") ||
  path.startsWith("docs/audits/") ||
  path.startsWith("docs/implementation/");

for (const path of tracked) {
  if (skipContent(path)) continue;
  let text = "";
  try {
    text = execFileSync("git", ["show", `HEAD:${path}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    continue;
  }
  if (!text || text.includes("\u0000")) continue;
  const urlHit = text
    .split(/\r?\n/)
    .some(
      (line) =>
        /postgres(ql)?:\/\/[^:\s]+:[^@\s]+@/.test(line) &&
        !/CHANGE_ME|YOUR_|EXAMPLE|postgres:postgres@|\$\{/.test(line),
    );
  if (urlHit) {
    console.error(`BLOCK connection string with password: ${path}`);
    fail = 1;
  }
  if (/re_[A-Za-z0-9]{20,}/.test(text)) {
    console.error(`BLOCK possible Resend key: ${path}`);
    fail = 1;
  }
}

if (fail) {
  console.error("secret/upload guard failed");
  process.exit(1);
}
console.log("secret/upload guard ok");
