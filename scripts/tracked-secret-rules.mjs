export function isBlockedTrackedPath(path) {
  const base = path.split("/").pop() ?? path;
  const allowedExample =
    path.endsWith(".example") ||
    path.endsWith(".env.example") ||
    path.endsWith(".env.coolify.example") ||
    /\.env\.[^/]+\.example$/.test(path);
  if (
    base === ".env" ||
    base === ".env.local" ||
    base === ".env.test" ||
    base === ".env.production" ||
    base === ".env.development" ||
    base === ".env.docker"
  ) {
    return true;
  }
  if (base.startsWith(".env.") && !allowedExample) return true;
  if (
    path.startsWith("r.e.c-backend/uploads/") ||
    path.includes("/uploads/study-materials/")
  ) {
    return true;
  }
  return false;
}
