import assert from "node:assert/strict";
import {
  buildRateLimitForwardHeaders,
  getClientIpFromIncomingRequest,
} from "./rate-limit-forward.ts";

function headers(map: Record<string, string>) {
  return {
    headers: {
      get(name: string) {
        return map[name] ?? null;
      },
    },
  };
}

process.env.TRUST_PROXY_HEADERS = "";
const spoofed = headers({
  "x-forwarded-for": "1.1.1.1, 2.2.2.2",
  "x-real-ip": "9.9.9.9",
});
assert.equal(getClientIpFromIncomingRequest(spoofed as never), null);

process.env.TRUST_PROXY_HEADERS = "1";
assert.equal(getClientIpFromIncomingRequest(spoofed as never), "9.9.9.9");
assert.equal(
  getClientIpFromIncomingRequest(
    headers({ "x-real-ip": "1.1.1.1, 8.8.8.8" }) as never,
  ),
  null,
);

const forwarded = buildRateLimitForwardHeaders(spoofed as never, {
  get: () => undefined,
});
assert.equal(forwarded.headers["X-Forwarded-For"], "9.9.9.9");
assert.equal(forwarded.headers["X-Visitor-Id"], undefined);

console.log("client-ip tests ok");
