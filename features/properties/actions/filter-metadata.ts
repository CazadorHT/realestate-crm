"use server";

import { requireAuthContext } from "@/lib/authz";
import { getSystemConfig } from "@/lib/actions/system-config";

// 5-minute memory cache for filter metadata on the server
const filterMetadataMemoryCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function invalidateFilterMetadataCache() {
  filterMetadataMemoryCache.clear();
}

/**
 * ⚡ On-Demand Lazy Action for Advanced Filter Metadata.
 * Fetches facet metadata only when user explicitly opens the Advanced Filter modal.
 * Protected by 5-minute in-memory cache to prevent Supabase egress spikes.
 */
export async function getPropertiesFilterMetadataAction(allBranches?: string): Promise<any[]> {
  try {
    const { supabase, role, tenantId } = await requireAuthContext();
    const config = await getSystemConfig();
    const isMultiTenant = config.multi_tenant_enabled;

    const cacheKey = `${role}-${tenantId || "default"}-${allBranches || "false"}`;
    const now = Date.now();
    const cached = filterMetadataMemoryCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    let q = supabase
      .from("properties")
      .select(
        "status, property_type, listing_type, price, rental_price, original_price, original_rental_price, bedrooms, bathrooms, province, district, popular_area, near_transit, is_pet_friendly, is_fully_furnished, requires_ai_review, assigned_to"
      )
      .is("deleted_at", null);

    if (isMultiTenant) {
      const isSuperAdmin = role === "ADMIN";
      const wantsAllBranches = allBranches === "true" || tenantId === "ALL" || !tenantId;
      if (!(wantsAllBranches && isSuperAdmin)) {
        if (tenantId && tenantId !== "ALL") {
          q = q.eq("tenant_id", tenantId);
        }
      }
    }

    const { data, error } = await q;
    if (error) {
      console.error("[getPropertiesFilterMetadataAction] Query error:", error);
      return cached?.data || [];
    }

    const result = data || [];
    if (filterMetadataMemoryCache.size > 100) filterMetadataMemoryCache.clear();
    filterMetadataMemoryCache.set(cacheKey, { data: result, timestamp: now });
    return result;
  } catch (err) {
    console.error("[getPropertiesFilterMetadataAction] Action error:", err);
    return [];
  }
}
