import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUpstreamBaseUrl } from "@/lib/server/upstream";

type RouteCtx = { params: Promise<{ path?: string[] }> };

const PASS_RESPONSE_HEADERS = ["content-type", "content-disposition", "cache-control"] as const;

async function proxyRequest(req: NextRequest, pathSegments: string[] | undefined) {
  const base = getUpstreamBaseUrl();
  const path = pathSegments?.length ? pathSegments.join("/") : "";
  const url = new URL(req.url);
  const targetUrl = `${base}/${path}${url.search}`;

  const method = req.method;
  const store = await cookies();
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

  // Reenviar IP del cliente real al backend para rate-limit per-IP
  const forwarded = req.headers.get("x-forwarded-for");
  const clientIp = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || req.ip;
  if (clientIp) {
    headers.set("X-Forwarded-For", clientIp);
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

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders,
  });
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
