import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

const modUrl = pathToFileURL(
  path.resolve("lib/server/rate-limit-forward.ts"),
).href;

const { getClientIpFromIncomingRequest, buildRateLimitForwardHeaders } =
  await import(modUrl);

process.env.TRUST_PROXY_HEADERS = "";
const spoofed = {
  headers: {
    get(name) {
      if (name === "x-forwarded-for") return "1.1.1.1, 2.2.2.2";
      if (name === "x-real-ip") return "9.9.9.9";
      return null;
    },
  },
};
assert(
  getClientIpFromIncomingRequest(spoofed) === null,
  "sin TRUST_PROXY_HEADERS no debe leer XFF ni X-Real-IP",
);

process.env.TRUST_PROXY_HEADERS = "1";
assert(
  getClientIpFromIncomingRequest(spoofed) === "9.9.9.9",
  "con proxy de confianza usa X-Real-IP, no el primer XFF",
);
const comma = {
  headers: {
    get(name) {
      if (name === "x-real-ip") return "1.1.1.1, 8.8.8.8";
      return null;
    },
  },
};
assert(getClientIpFromIncomingRequest(comma) === null, "rechaza X-Real-IP con coma");

const headers = buildRateLimitForwardHeaders(spoofed, { get: () => undefined });
assert(
  headers.headers["X-Forwarded-For"] === "9.9.9.9",
  "el BFF reenvía la IP de confianza, no 1.1.1.1",
);
assert(!headers.headers["X-Visitor-Id"], "no manda visitor-id rotatable");

console.log("client-ip tests ok");
void require;
