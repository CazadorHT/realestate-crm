import { requireAuthContext, assertStaff } from "@/lib/authz";
import { getSystemConfig } from "@/lib/actions/system-config";
import { PropertyStats } from "./types";

export async function getPropertiesDashboardStatsQuery(
  allBranches?: string,
): Promise<PropertyStats> {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  // Build Query
  let query = supabase
    .from("properties")
    .select(
      "id, status, price, rental_price, original_price, original_rental_price, property_type, listing_type, commission_sale_percentage, commission_rent_months, requires_ai_review",
    )
    .is("deleted_at", null);

  if (isMultiTenant) {
    if (allBranches === "true" || tenantId === "ALL" || !tenantId) {
      // ALL Branches: include all
    } else {
      // Specific branch
      query = query.eq("tenant_id", tenantId);
    }
  }

  const { data, error } = await query;

  if (error || !data) {
    return {
      total: 0,
      available: 0,
      soldOrRented: 0,
      totalValue: 0,
      totalSaleCommission: 0,
      totalRentCommission: 0,
      totalRealizedCommission: 0,
      byType: [],
      byStatus: [],
      aiReviewCount: 0,
    };
  }

  const total = data.length;
  const active = data.filter((p) => p.status === "ACTIVE").length;
  const soldOrRented = data.filter((p) =>
    ["SOLD", "RENTED"].includes(p.status),
  ).length;
  const aiReviewCount = data.filter((p) => (p as any).requires_ai_review).length;

  const totalValue = data
    .filter((p) => p.status === "ACTIVE")
    .reduce((sum, p) => sum + (p.price || p.original_price || 0), 0);

  let totalSaleCommission = 0;
  let totalRentCommission = 0;
  let totalRealizedCommission = 0;

  data.forEach((p) => {
    const salePrice = (p.price || 0) > 0 ? p.price : p.original_price || 0;
    const rentPrice =
      (p.rental_price || 0) > 0 ? p.rental_price : p.original_rental_price || 0;

    if (p.status === "ACTIVE") {
      if (
        (p.listing_type === "SALE" || p.listing_type === "SALE_AND_RENT") &&
        salePrice &&
        salePrice > 0
      ) {
        totalSaleCommission +=
          (salePrice * (p.commission_sale_percentage || 3)) / 100;
      }

      if (
        (p.listing_type === "RENT" || p.listing_type === "SALE_AND_RENT") &&
        rentPrice &&
        rentPrice > 0
      ) {
        totalRentCommission += rentPrice * (p.commission_rent_months || 1);
      }
    }

    if (p.status === "SOLD") {
      const finalPrice = (p.price || 0) > 0 ? p.price : p.original_price || 0;
      if (finalPrice && finalPrice > 0) {
        totalRealizedCommission +=
          (finalPrice * (p.commission_sale_percentage || 3)) / 100;
      }
    } else if (p.status === "RENTED") {
      const finalRentPrice =
        (p.rental_price || 0) > 0
          ? p.rental_price
          : p.original_rental_price || 0;
      if (finalRentPrice && finalRentPrice > 0) {
        totalRealizedCommission +=
          finalRentPrice * (p.commission_rent_months || 1);
      }
    }
  });

  const typeMap = new Map<string, number>();
  data.forEach((p) => {
    const t = p.property_type || "Unknown";
    typeMap.set(t, (typeMap.get(t) || 0) + 1);
  });
  const byType = Array.from(typeMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  const statusMap = new Map<string, number>();
  data.forEach((p) => {
    const s = p.status || "Unknown";
    statusMap.set(s, (statusMap.get(s) || 0) + 1);
  });
  const byStatus = Array.from(statusMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  return {
    total,
    available: active, 
    soldOrRented,
    totalValue,
    totalSaleCommission,
    totalRentCommission,
    totalRealizedCommission,
    byType,
    byStatus,
    aiReviewCount,
  };
}
