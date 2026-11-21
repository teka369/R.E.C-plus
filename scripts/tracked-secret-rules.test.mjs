import assert from "node:assert/strict";
import { isBlockedTrackedPath } from "./tracked-secret-rules.mjs";

assert.equal(isBlockedTrackedPath("r.e.c-backend/.env"), true);
assert.equal(isBlockedTrackedPath("r.e.c-frontend/.env.local"), true);
assert.equal(isBlockedTrackedPath("r.e.c-backend/.env.test"), true);
assert.equal(isBlockedTrackedPath(".env"), true);
assert.equal(
  isBlockedTrackedPath(
    "r.e.c-backend/uploads/study-materials/file.pdf",
  ),
  true,
);
assert.equal(isBlockedTrackedPath("r.e.c-backend/.env.example"), false);
assert.equal(isBlockedTrackedPath("r.e.c-frontend/.env.production.example"), false);
assert.equal(isBlockedTrackedPath(".env.coolify.example"), false);
assert.equal(isBlockedTrackedPath("r.e.c-backend/src/main.ts"), false);
assert.equal(isBlockedTrackedPath("rec-secrets.env"), true);
assert.equal(isBlockedTrackedPath("scripts/deploy/local.secrets.env"), true);
assert.equal(isBlockedTrackedPath("key.md"), true);

console.log("tracked-secret-rules ok");
