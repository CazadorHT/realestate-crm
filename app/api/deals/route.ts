import { NextResponse } from "next/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { getDeals, getDealStats } from "@/features/deals/queries.getDeals";

export async function GET(request: Request) {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? undefined;
    const lead_id = url.searchParams.get("lead_id") ?? undefined;
    const property_id = url.searchParams.get("property_id") ?? undefined;
    const status = url.searchParams.get("status") as any ?? undefined;
    const deal_type = url.searchParams.get("deal_type") as any ?? undefined;
    const property_type = url.searchParams.get("property_type") ?? undefined;
    const listing_type = url.searchParams.get("listing_type") ?? undefined;
    const timeRange = url.searchParams.get("timeRange") ?? undefined;
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
    const order =
      (url.searchParams.get("order") as "created_at" | "transaction_date" | "commission_amount" | "updated_at") ??
      "created_at";
    const ascending = url.searchParams.get("ascending") === "true";

    const [res, stats] = await Promise.all([
      getDeals({
        q,
        lead_id,
        property_id,
        status,
        deal_type,
        property_type,
        listing_type,
        page,
        pageSize,
        order,
        ascending,
        timeRange,
      }),
      getDealStats(),
    ]);

    return NextResponse.json({ ...res, stats });
  } catch (error) {
    console.error("GET /api/deals error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
