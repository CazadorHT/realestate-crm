import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";

// This endpoint could be triggered by Vercel Cron or manually.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Option A: Secure with a CRON secret token to prevent unauthorized execution
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    // Uncomment to enforce security:
    // return new NextResponse('Unauthorized', { status: 401 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );

  try {
    console.log("[Cron MarketAlerts] Starting analysis...");

    // 1. Fetch currently active properties
    const { data: activeProperties, error: propertiesError } = await supabase
      .from("properties")
      .select(
        "id, title, listing_type, original_price, size_sqm, popular_area, district, property_type, created_by",
      )
      .eq("status", "ACTIVE")
      .not("size_sqm", "is", null) // Need size to calculate Price/Sqm
      .not("original_price", "is", null);

    if (propertiesError) throw propertiesError;
    if (!activeProperties || activeProperties.length === 0) {
      return NextResponse.json({ message: "No active properties to analyze." });
    }

    // 2. Fetch recent closed deals to calculate market average
    const { data: closedDeals, error: dealsError } = await supabase
      .from("deals")
      .select(
        "property_id, status, properties(size_sqm, popular_area, district, property_type, original_price)",
      )
      .eq("status", "CLOSED_WIN")
      .order("created_at", { ascending: false })
      .limit(100);

    if (dealsError) throw dealsError;

    // 3. Group closed deals by Area + PropertyType + ListingType to calculate averages
    // Example Key: "Sukhumvit-CONDO-SALE"
    const marketAverages: Record<
      string,
      { totalValue: number; totalSqm: number; count: number }
    > = {};

    closedDeals?.forEach((deal) => {
      const prop = (
        Array.isArray(deal.properties) ? deal.properties[0] : deal.properties
      ) as any;
      if (!prop || !prop.size_sqm) return;

      // Determine the location key: prefer popular_area, fallback to district
      const area = prop.popular_area || prop.district;
      if (!area) return;

      // Notice: deals table doesn't have listing_type directly unless we join,
      // but let's assume SALE for typical AVM drops or use original_price.
      // For simplicity, we just look at property_type and area
      const key = `${area}-${prop.property_type}`;
      const dealValue = Number(prop.original_price) || 0;

      if (dealValue <= 0) return;

      if (!marketAverages[key]) {
        marketAverages[key] = { totalValue: 0, totalSqm: 0, count: 0 };
      }

      marketAverages[key].totalValue += dealValue;
      marketAverages[key].totalSqm += prop.size_sqm;
      marketAverages[key].count += 1;
    });

    const alertsGenerated = [];

    // 4. Compare Active Properties vs Market Average
    for (const property of activeProperties) {
      const area = property.popular_area || property.district;
      if (!area || !property.size_sqm || !property.original_price) continue;

      const key = `${area}-${property.property_type}`;
      const marketData = marketAverages[key];

      // We need at least 2 closed deals in the area to form a reliable baseline
      if (marketData && marketData.count >= 2) {
        const avgMarketPricePerSqm =
          marketData.totalValue / marketData.totalSqm;
        const originalPrice = Number(property.original_price);
        const sizeSqm = Number(property.size_sqm);

        if (originalPrice <= 0 || sizeSqm <= 0) continue;

        const currentPropertyPricePerSqm = originalPrice / sizeSqm;

        // Prevent division by zero safely
        if (avgMarketPricePerSqm <= 0) continue;

        // Condition for Market Drop Alert:
        // If current asking price / sqm is > 15% higher than the market average of closed deals
        const diffPercent =
          ((currentPropertyPricePerSqm - avgMarketPricePerSqm) /
            avgMarketPricePerSqm) *
          100;

        if (diffPercent > 15) {
          alertsGenerated.push({
            property_id: property.id,
            title: property.title,
            diff_percent: Math.round(diffPercent),
            current_price: property.original_price,
            market_avg_sqm: Math.round(avgMarketPricePerSqm),
            prop_avg_sqm: Math.round(currentPropertyPricePerSqm),
          });

          // Log to audit_logs as a way to alert the admin/agent
          await supabase.from("audit_logs").insert({
            action: "MARKET_DROP_ALERT",
            entity: "properties",
            entity_id: property.id,
            user_id: property.created_by || "system", // Fallback to system if unknown
            metadata: {
              diff_percent: diffPercent,
              current_price: property.original_price,
              market_avg_sqm: avgMarketPricePerSqm,
              prop_avg_sqm: currentPropertyPricePerSqm,
              message: `ราคาตั้งขายสูงกว่าค่าเฉลี่ยตลาด ${Math.round(diffPercent)}%`,
            },
          });
        }
      }
    }

    console.log(
      `[Cron MarketAlerts] Finished. Generated ${alertsGenerated.length} alerts.`,
    );

    return NextResponse.json({
      success: true,
      alerts_count: alertsGenerated.length,
      alerts: alertsGenerated,
    });
  } catch (err: any) {
    console.error("[Cron MarketAlerts] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
