import { NextRequest, NextResponse } from "next/server";

function backendBase(segments: string[]): { url: string; stripPrefix: boolean } {
  const mlPrefix = segments[0] === "ia";
  if (mlPrefix) {
    return { url: (process.env.ML_API_URL || "http://127.0.0.1:8002").replace(/\/$/, ""), stripPrefix: true };
  }

  return { url: (process.env.API_URL || "http://127.0.0.1:8001").replace(/\/$/, ""), stripPrefix: false };
}

async function forward(
  request: NextRequest,
  segments: string[],
): Promise<NextResponse> {
  const u = new URL(request.url);
  const { url, stripPrefix } = backendBase(segments);
  const route = stripPrefix ? segments.slice(1).join("/") : `api/v1/${segments.join("/")}`;
  const target = `${url}/${route}${u.search}`;

  const headers = new Headers();
  for (const name of ["authorization", "content-type", "accept"]) {
    const v = request.headers.get(name);
    if (v) headers.set(name, v);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (!["GET", "HEAD", "DELETE"].includes(request.method)) {
    const body = await request.arrayBuffer();
    if (body.byteLength) init.body = body;
  }

  let res: Response;
  try {
    res = await fetch(target, init);
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : "Erreur réseau vers l'API (vérifie que le service FastAPI tourne, ex. mspr_api sur 8001).";
    return NextResponse.json(
      {
        detail:
          "Impossible de joindre l'API MSPR. Lance `docker compose up` (ou uvicorn) et ouvre /docs sur le port 8001.",
        cause: msg,
      },
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }
  const out = new NextResponse(await res.arrayBuffer(), {
    status: res.status,
  });
  const ct = res.headers.get("content-type");
  if (ct) out.headers.set("content-type", ct);
  return out;
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(request, path);
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(request, path);
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(request, path);
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(request, path);
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(request, path);
}
