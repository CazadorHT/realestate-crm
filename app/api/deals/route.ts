import { NextResponse } from "next/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { getDeals } from "@/features/deals/queries.getDeals";

export async function GET(request: Request) {
  const { role } = await requireAuthContext();
  assertStaff(role);

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? undefined;
  const lead_id = url.searchParams.get("lead_id") ?? undefined;
  const property_id = url.searchParams.get("property_id") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
  const order =
    (url.searchParams.get("order") as "created_at" | "transaction_date") ??
    "created_at";
  const ascending = url.searchParams.get("ascending") === "true";

  const res = await getDeals({
    q,
    lead_id,
    property_id,
    status: status as any, // Cast to DealStatus
    page,
    pageSize,
    order,
    ascending,
  });

  return NextResponse.json(res);
}
