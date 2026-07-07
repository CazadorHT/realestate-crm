import { NextResponse } from "next/server";
import { getAiLogs } from "@/features/ai-monitor/actions";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") || "50");
    const logs = await getAiLogs(limit);
    return NextResponse.json(logs, {
      headers: {
        "Cache-Control": "public, s-maxage=5, stale-while-revalidate=30",
      },
    });
  } catch (err) {
    console.error("/api/ai-monitor/logs error:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
