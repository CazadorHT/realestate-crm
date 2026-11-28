import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const REDIS_KEY = "vcc_ext_team_groups";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface TeamGroup {
  id: string;
  name: string;
  url: string;
  tags: string[];
  addedAt: string;
}

function normalizeUrl(url: string): string {
  return (url.split("?")[0] ?? url).replace(/\/+$/, "");
}

function checkAuth(req: NextRequest): boolean {
  const expectedToken = process.env.VCC_EXTENSION_API_TOKEN?.trim();
  if (!expectedToken) return true;
  const authHeader = req.headers.get("authorization") || "";
  const provided = authHeader.replace(/^Bearer\s+/i, "").trim();
  return Boolean(provided && provided === expectedToken);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }
  if (!redis) {
    return NextResponse.json(
      { ok: false, error: "Redis not configured" },
      { status: 503, headers: CORS_HEADERS },
    );
  }
  try {
    const raw = await redis.get<TeamGroup[]>(REDIS_KEY);
    const groups = Array.isArray(raw) ? raw : [];
    return NextResponse.json({ ok: true, groups }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("[TeamGroups] GET error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to load team groups" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }
  if (!redis) {
    return NextResponse.json(
      { ok: false, error: "Redis not configured" },
      { status: 503, headers: CORS_HEADERS },
    );
  }
  try {
    const body = (await req.json()) as { groups?: TeamGroup[] };
    const incoming = Array.isArray(body.groups) ? body.groups : [];

    const existingRaw = await redis.get<TeamGroup[]>(REDIS_KEY);
    const existing = Array.isArray(existingRaw) ? existingRaw : [];

    const map = new Map<string, TeamGroup>();
    for (const g of existing) {
      if (g?.id && g?.url) map.set(normalizeUrl(g.url), g);
    }

    let uploadedNew = 0;
    for (const g of incoming) {
      if (!g?.id || !g?.name || !g?.url) continue;
      if (/^(ยังไม่ได้อ่าน|Unread|ยินดีต้อนรับสู่)/i.test(g.name.trim())) continue;
      const norm = normalizeUrl(g.url);
      if (!map.has(norm)) {
        uploadedNew++;
        map.set(norm, {
          id: String(g.id),
          name: String(g.name).slice(0, 160),
          url: norm,
          tags: Array.isArray(g.tags) ? g.tags.map(String).slice(0, 5) : [],
          addedAt: g.addedAt || new Date().toISOString(),
        });
      }
    }

    const merged = Array.from(map.values()).slice(0, 500);
    await redis.set(REDIS_KEY, merged);

    return NextResponse.json(
      { ok: true, groups: merged, uploadedNew, total: merged.length },
      { headers: CORS_HEADERS },
    );
  } catch (err) {
    console.error("[TeamGroups] POST error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to sync team groups" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
