import { NextResponse } from "next/server";
import { getAiDashboardStats } from "@/features/ai-monitor/actions";

export async function GET() {
  try {
    const stats = await getAiDashboardStats();
    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    });
  } catch (err) {
    console.error("/api/ai-monitor/stats error:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
