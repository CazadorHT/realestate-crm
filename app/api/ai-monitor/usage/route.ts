import { NextResponse } from "next/server";
import { getAiUsageStats, getAiDashboardStats } from "@/features/ai-monitor/actions";

export async function GET() {
  try {
    const usage = await getAiUsageStats();
    const dashboard = await getAiDashboardStats();

    const payload = {
      ...usage,
      totalCostThb: dashboard.totalCostThb,
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=5, stale-while-revalidate=15",
      },
    });
  } catch (err) {
    console.error("/api/ai-monitor/usage error:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
