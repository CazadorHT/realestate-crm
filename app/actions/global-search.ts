"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";

export type SearchResult = {
  id: string;
  type: "property" | "lead" | "deal" | "agent" | "owner";
  title: string;
  subtitle?: string;
  url: string;
};

import { 
  PropertyMinimal, 
  LeadMinimal, 
  DealMinimal, 
  ProfileMinimal, 
  OwnerMinimal 
} from "@/lib/supabase/types-helper";

export async function globalSearchAction(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  const cleanQuery = query.trim();
  const isAllTenants = tenantId === "ALL";
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQuery);
  const isREF = /^[0-9a-f]{8}$/i.test(cleanQuery);

  // Smart mapping for property types (Thai -> Enum)
  let typeFilter = "";
  const thToEnType: Record<string, string> = {
    "บ้าน": "HOUSE",
    "คอนโด": "CONDO",
    "ทาวน์": "TOWNHOME",
    "ที่ดิน": "LAND",
    "วิลล่า": "VILLA",
    "ออฟฟิศ": "OFFICE",
    "โกดัง": "WAREHOUSE",
    "ตึก": "COMMERCIAL"
  };

  const matchedType = Object.entries(thToEnType).find(([th]) => cleanQuery.includes(th))?.[1];
  if (matchedType) {
    typeFilter = `,property_type.eq.${matchedType}`;
  }

  // Helper to build a base query with tenant scoping
  function getBaseQuery(table: "properties" | "leads" | "deals" | "owners", columns: string) {
    let q = supabase.from(table).select(columns);
    if (!isAllTenants && tenantId) {
      q = q.eq("tenant_id", tenantId);
    }
    return q;
  }

  // Parallel queries for speed
  const [propertiesRes, leadsRes, dealsRes, agentsRes, ownersRes] = await Promise.all([
    // 1. Properties - Expanded with more columns and REF priority
    (() => {
      let q = getBaseQuery("properties", "id, title, popular_area, district, province, property_type, address_line1");
      
      if (isUUID) {
        return q.eq("id", cleanQuery);
      } 
      
      // Build a broad search string
      let conditions = [
        `title.ilike.%${cleanQuery}%`,
        `popular_area.ilike.%${cleanQuery}%`,
        `district.ilike.%${cleanQuery}%`,
        `province.ilike.%${cleanQuery}%`,
        `address_line1.ilike.%${cleanQuery}%`
      ];
      
      // ONLY search ID if it's a valid hex fragment to avoid Postgres UUID cast errors
      const isHexFragment = /^[0-9a-fA-F-]+$/.test(cleanQuery);
      if (isHexFragment) {
        if (isREF) {
          conditions.unshift(`id.ilike.${cleanQuery}%`);
        } else {
          conditions.unshift(`id.ilike.%${cleanQuery}%`);
        }
      }

      const orFilter = conditions.join(",");
      return q.or(orFilter + typeFilter);
    })().limit(10),

    // 2. Leads - Search by name, phone, email and partial ID
    (() => {
      let q = getBaseQuery("leads", "id, full_name, phone, email");
      if (isUUID) return q.eq("id", cleanQuery);
      
      let conditions = [
        `full_name.ilike.%${cleanQuery}%`,
        `phone.ilike.%${cleanQuery}%`,
        `email.ilike.%${cleanQuery}%`
      ];

      const isHexFragment = /^[0-9a-fA-F-]+$/.test(cleanQuery);
      if (isHexFragment) {
        if (isREF) {
          conditions.unshift(`id.ilike.${cleanQuery}%`);
        } else {
          conditions.unshift(`id.ilike.%${cleanQuery}%`);
        }
      }

      return q.or(conditions.join(","));
    })().limit(5),

    // 3. Deals - Search by deal ID
    (isUUID 
      ? getBaseQuery("deals", "id, property:properties(title), lead:leads(full_name)").eq("id", cleanQuery)
      : getBaseQuery("deals", "id, property:properties(title), lead:leads(full_name)")
          .or(`id.ilike.%${cleanQuery}%`)
    ).limit(5),

    // 4. Agents (Profiles)
    supabase.from("profiles")
      .select("id, full_name, email, phone")
      .or(`full_name.ilike.%${cleanQuery}%,email.ilike.%${cleanQuery}%,phone.ilike.%${cleanQuery}%`)
      .limit(5),

    // 5. Owners
    (isUUID 
      ? getBaseQuery("owners", "id, full_name, phone, company_name").eq("id", cleanQuery)
      : getBaseQuery("owners", "id, full_name, phone, company_name")
          .or(`full_name.ilike.%${cleanQuery}%,phone.ilike.%${cleanQuery}%,company_name.ilike.%${cleanQuery}%`)
    ).limit(5),
  ]);

  const results: SearchResult[] = [];

  // Map Results with type safety
  if (propertiesRes.data) {
    (propertiesRes.data as unknown as PropertyMinimal[]).forEach((p: PropertyMinimal) => {
      results.push({
        id: p.id,
        type: "property",
        title: p.title || "ไม่ระบุชื่อทรัพย์",
        subtitle: `REF: #${p.id.slice(0, 8)} | ${p.popular_area || p.district || "ไม่ระบุทำเล"}`,
        url: `/protected/properties/${p.id}`,
      });
    });
  }

  if (leadsRes.data) {
    (leadsRes.data as unknown as LeadMinimal[]).forEach((l: LeadMinimal) => {
      results.push({
        id: l.id,
        type: "lead",
        title: l.full_name || "ไม่ระบุชื่อลูกค้า",
        subtitle: `${l.phone || ""} ${l.email ? `| ${l.email}` : ""}`,
        url: `/protected/leads/${l.id}`,
      });
    });
  }

  if (dealsRes.data) {
    type JoinedDeal = {
      id: string;
      property: { title: string | null } | { title: string | null }[] | null;
      lead: { full_name: string | null } | { full_name: string | null }[] | null;
    };

    (dealsRes.data as unknown as JoinedDeal[]).forEach((d) => {
      const propTitle = Array.isArray(d.property) ? d.property[0]?.title : d.property?.title;
      const leadName = Array.isArray(d.lead) ? d.lead[0]?.full_name : d.lead?.full_name;
      
      results.push({
        id: d.id,
        type: "deal",
        title: `ดีล #${d.id.slice(0, 8)}`,
        subtitle: `${propTitle || "ไม่ระบุทรัพย์"} | ${leadName || "ไม่ระบุลูกค้า"}`,
        url: `/protected/deals/${d.id}`,
      });
    });
  }

  if (agentsRes.data) {
    (agentsRes.data as unknown as ProfileMinimal[]).forEach((a: ProfileMinimal) => {
      results.push({
        id: a.id,
        type: "agent",
        title: a.full_name || "ไม่ระบุชื่อเอเจนท์",
        subtitle: `${a.email || ""} ${a.phone ? `| ${a.phone}` : ""}`,
        url: `/protected/settings/members`,
      });
    });
  }

  if (ownersRes.data) {
    (ownersRes.data as unknown as OwnerMinimal[]).forEach((o: OwnerMinimal) => {
      results.push({
        id: o.id,
        type: "owner",
        title: o.full_name || "ไม่ระบุชื่อเจ้าของ",
        subtitle: `${o.phone || ""} ${o.company_name ? `| ${o.company_name}` : ""}`,
        url: `/protected/owners/${o.id}`,
      });
    });
  }

  return results;
}
