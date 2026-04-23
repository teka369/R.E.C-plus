import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUpstreamBaseUrl } from "@/lib/server/upstream";
import {
  applyRateLimitVisitorCookie,
  buildRateLimitForwardHeaders,
} from "@/lib/server/rate-limit-forward";

type RouteCtx = { params: Promise<{ path?: string[] }> };

const PASS_RESPONSE_HEADERS = ["content-type", "content-disposition", "cache-control"] as const;

async function proxyRequest(req: NextRequest, pathSegments: string[] | undefined) {
  const base = getUpstreamBaseUrl();
  const path = pathSegments?.length ? pathSegments.join("/") : "";
  const url = new URL(req.url);
  const targetUrl = `${base}/${path}${url.search}`;

  const method = req.method;
  const store = await cookies();
  const { headers: rlHeaders, setVisitorCookie } = buildRateLimitForwardHeaders(req, store);
  const token = store.get("rec_token")?.value;

  const pathJoined = pathSegments?.length ? pathSegments.join("/") : "";
  const omitBearer =
    pathJoined === "auth/login" ||
    pathJoined === "auth/refresh" ||
    pathJoined === "auth/logout";

  const headers = new Headers();
  if (token && !omitBearer) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  for (const [k, v] of Object.entries(rlHeaders)) {
    headers.set(k, v);
  }

  const contentType = req.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }
  const accept = req.headers.get("accept");
  if (accept) {
    headers.set("accept", accept);
  }

  let body: ArrayBuffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    body = await req.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      redirect: "manual",
    });
  } catch {
    return NextResponse.json({ message: "No se pudo contactar al API backend" }, { status: 502 });
  }

  const outHeaders = new Headers();
  for (const name of PASS_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) {
      outHeaders.set(name, value);
    }
  }

  const res = new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders,
  });
  applyRateLimitVisitorCookie(res, setVisitorCookie);
  return res;
}

function bindHandler() {
  return async (req: NextRequest, ctx: RouteCtx) => {
    const { path } = await ctx.params;
    return proxyRequest(req, path);
  };
}

export const GET = bindHandler();
export const POST = bindHandler();
export const PUT = bindHandler();
export const PATCH = bindHandler();
export const DELETE = bindHandler();
