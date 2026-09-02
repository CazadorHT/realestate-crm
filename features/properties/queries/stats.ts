import { requireAuthContext, assertStaff } from "@/lib/authz";
import { getSystemConfig } from "@/lib/actions/system-config";
import { getScopedRevenueClient } from "@/features/deals/logic/scoped-client";
import { PropertyStats } from "./types";
import { cache } from "react";

export const getPropertiesDashboardStatsQuery = cache(async (
  allBranches?: string,
): Promise<PropertyStats> => {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  const buildBaseQuery = () => {
    let q = supabase.from("properties").select("id", { count: "exact" }).is("deleted_at", null);
    if (isMultiTenant) {
      const isSuperAdmin = role === "ADMIN";
      const wantsAllBranches = allBranches === "true" || tenantId === "ALL" || !tenantId;
      if (!(wantsAllBranches && isSuperAdmin) && tenantId && tenantId !== "ALL") {
        q = q.eq("tenant_id", tenantId);
      }
    }
    return q;
  };

  // [OPTIMIZATION] Parallel Aggregated Counts to avoid fetching all rows
  const [
    { count: total },
    { count: active },
    { count: soldOrRented },
    { count: aiReviewCount },
    { data: statusStatsRaw },
    { data: typeStatsRaw },
    { data: financialDataRaw }
  ] = await Promise.all([
    buildBaseQuery(),
    buildBaseQuery().eq("status", "ACTIVE"),
    buildBaseQuery().in("status", ["SOLD", "RENTED"]),
    buildBaseQuery().eq("requires_ai_review", true),
    // Status distribution
    buildBaseQuery().select("status"), 
    // Type distribution
    buildBaseQuery().select("property_type"),
    // Financial aggregation (Still need some rows for complex commission logic, but limited to ACTIVE/SOLD/RENTED)
    buildBaseQuery().select("status, price, rental_price, original_price, original_rental_price, listing_type, commission_sale_percentage, commission_rent_months, co_agent_sale_commission_percent").in("status", ["ACTIVE", "SOLD", "RENTED"])
  ]);

  const statusStats = statusStatsRaw as { status: string | null }[] | null;
  const typeStats = typeStatsRaw as { property_type: string | null }[] | null;
  const financialData = financialDataRaw as { 
    status: string | null; 
    price: number | null; 
    rental_price: number | null; 
    original_price: number | null; 
    original_rental_price: number | null; 
    listing_type: string | null; 
    commission_sale_percentage: number | null; 
    commission_rent_months: number | null;
    co_agent_sale_commission_percent: number | null;
  }[] | null;

  // Financial calculations
  let totalValue = 0;
  let totalSaleCommission = 0;
  let totalRentCommission = 0;
  let totalRealizedCommission = 0;
  let totalNetSaleCommission = 0;
  let totalNetRealizedCommission = 0;

  // Query actual CLOSED_WIN deals and their commissions to calculate true realized/net commissions
  const scoped = getScopedRevenueClient(supabase, tenantId);
  const { data: closedDeals } = (await scoped.deals()
    .select("id, commission_total, commissions:crm_deal_commissions_v3(recipient_role, amount)")
    .eq("status", "CLOSED_WIN")) as any;

  closedDeals?.forEach((d: any) => {
    const gross = Number(d.commission_total) || 0;
    const commissions = (d as any).commissions || [];
    const coAgentSum = commissions
      .filter((c: any) => c.recipient_role === "CO_AGENT")
      .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);
    
    totalRealizedCommission += Math.max(0, gross - coAgentSum);

    const agencyComm = commissions.find((c: any) => c.recipient_role === "AGENCY");
    if (agencyComm) {
      totalNetRealizedCommission += Number(agencyComm.net_amount ?? agencyComm.amount) || 0;
    } else {
      const agentSplits = commissions
        .filter((c: any) => c.recipient_role !== "AGENCY")
        .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);
      totalNetRealizedCommission += Math.max(0, gross - agentSplits);
    }
  });

  financialData?.forEach((p) => {
    const salePrice = (p.price ?? 0) > 0 ? (p.price ?? 0) : (p.original_price ?? 0);
    const rentPrice = (p.rental_price ?? 0) > 0 ? (p.rental_price ?? 0) : (p.original_rental_price ?? 0);

    const saleCommPercent = p.commission_sale_percentage || 3;
    const coBrokerPercent = p.co_agent_sale_commission_percent || 0;
    const netSaleCommPercent = Math.max(0, saleCommPercent - coBrokerPercent);

    if (p.status === "ACTIVE") {
      totalValue += (salePrice || 0);
      if ((p.listing_type === "SALE" || p.listing_type === "SALE_AND_RENT") && salePrice > 0) {
        totalSaleCommission += (salePrice * saleCommPercent) / 100;
        totalNetSaleCommission += (salePrice * netSaleCommPercent) / 100;
      }
      if ((p.listing_type === "RENT" || p.listing_type === "SALE_AND_RENT") && rentPrice > 0) {
        totalRentCommission += rentPrice * (p.commission_rent_months || 1);
      }
    }
  });

  // Distribution maps
  const typeMap = new Map<string, number>();
  typeStats?.forEach((p) => {
    const t = p.property_type || "Unknown";
    typeMap.set(t, (typeMap.get(t) || 0) + 1);
  });
  
  const statusMap = new Map<string, number>();
  statusStats?.forEach((p) => {
    const s = p.status || "Unknown";
    statusMap.set(s, (statusMap.get(s) || 0) + 1);
  });

  return {
    total: total || 0,
    available: active || 0,
    soldOrRented: soldOrRented || 0,
    totalValue,
    totalSaleCommission,
    totalRentCommission,
    totalRealizedCommission,
    totalNetRealizedCommission,
    totalNetSaleCommission,
    byType: Array.from(typeMap.entries()).map(([name, value]) => ({ name, value })),
    byStatus: Array.from(statusMap.entries()).map(([name, value]) => ({ name, value })),
    aiReviewCount: aiReviewCount || 0,
  };
});

/**
 * ⚡ FAST COUNT: Returns only the total number of properties for the header.
 * Uses 'head: true' to minimize data transfer and DB load.
 */
export async function getPropertiesFastCountQuery(allBranches?: string): Promise<number> {
  const { supabase, role, tenantId } = await requireAuthContext();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  let query = supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);

  if (isMultiTenant) {
    const isSuperAdmin = role === "ADMIN";
    const wantsAllBranches = allBranches === "true" || tenantId === "ALL" || !tenantId;

    if (!(wantsAllBranches && isSuperAdmin)) {
      if (tenantId && tenantId !== "ALL") {
        query = query.eq("tenant_id", tenantId);
      }
    }
  }

  const { count } = await query;
  return count || 0;
}

// 🚀 Memory Cache for AI Review Count Badge (3-minute TTL) to prevent repeated HEAD queries during CRM navigation
const aiReviewMemoryCache = new Map<string, { count: number; timestamp: number }>();
const AI_REVIEW_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export function invalidateAiReviewCountCache() {
  aiReviewMemoryCache.clear();
}

/**
 * ⚡ FAST COUNT: Returns only the count of properties requiring AI review for sidebar badge.
 * Uses 'head: true' to minimize data transfer and DB load (0 bytes payload egress) + 3-min Memory Cache.
 */
export async function getAiReviewCountQuery(allBranches?: string): Promise<number> {
  const { supabase, role, tenantId } = await requireAuthContext();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  const cacheKey = `${role}-${tenantId || "default"}-${allBranches || "false"}`;
  const now = Date.now();
  const cached = aiReviewMemoryCache.get(cacheKey);
  if (cached && now - cached.timestamp < AI_REVIEW_CACHE_TTL_MS) {
    return cached.count;
  }

  let query = supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("requires_ai_review", true);

  if (isMultiTenant) {
    const isSuperAdmin = role === "ADMIN";
    const wantsAllBranches = allBranches === "true" || tenantId === "ALL" || !tenantId;

    if (!(wantsAllBranches && isSuperAdmin)) {
      if (tenantId && tenantId !== "ALL") {
        query = query.eq("tenant_id", tenantId);
      }
    }
  }

  const { count } = await query;
  const total = count || 0;
  aiReviewMemoryCache.set(cacheKey, { count: total, timestamp: now });
  return total;
}
