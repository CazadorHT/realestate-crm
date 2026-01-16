import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "month";

  const supabase = await createClient();
  const now = new Date();

  let startDate: Date;
  let endDate: Date = now;

  // Calculate date range
  switch (range) {
    case "6months":
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case "all":
      startDate = new Date(2000, 0, 1); // Far enough back
      break;
    case "month":
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Fetch revenue
  const { data: revenueData } = await supabase
    .from("properties")
    .select("price, rental_price, status")
    .in("status", ["SOLD", "RENTED"])
    .gte("updated_at", startDate.toISOString())
    .lte("updated_at", endDate.toISOString());

  const revenueThisMonth =
    revenueData?.reduce((sum, p) => {
      return sum + (p.status === "SOLD" ? p.price || 0 : p.rental_price || 0);
    }, 0) || 0;

  const totalCommission = revenueThisMonth * 0.03; // 3% assumption

  // Fetch leads
  const { count: leadsThisMonth } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  const { count: leadsTotal } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });

  // Fetch deals
  const { count: dealsWon } = await supabase
    .from("deals")
    .select("*", { count: "exact", head: true })
    .eq("status", "CLOSED_WIN")
    .gte("updated_at", startDate.toISOString())
    .lte("updated_at", endDate.toISOString());

  // Return stats (simplified - you can calculate proper changes)
  const stats = {
    revenueThisMonth,
    revenueChange: "+0%", // Placeholder
    leadsThisMonth: leadsThisMonth || 0,
    leadsChange: "+0%",
    leadsTotal: leadsTotal || 0,
    totalCommission,
    dealsWon: dealsWon || 0,
    dealsWonChange: "+0%",
    dealsTarget: 10,
  };

  return NextResponse.json({ data: stats });
}
