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

  const fuzzyQuery = cleanQuery
    .replace(/([ก-ฮa-zA-Z])(\d)/g, '$1%$2')
    .replace(/(\d)([ก-ฮa-zA-Z])/g, '$1%$2')
    .replace(/\s+/g, "%");

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
    // 1. Properties - Expanded with Smart Token Logic & Project Lookup
    (async () => {
      let q = getBaseQuery(
        "properties", 
        "id, title, popular_area, district, province, property_type, address_line1, assigned_to, project_id, projects:projects!properties_core_project_id_fkey(name)"
      );
      if (isUUID) return q.eq("id", cleanQuery).limit(10);

      const tokens = cleanQuery.split(/\s+/).filter(t => t.length > 0);
      
      // [AGENT & PROJECT LOOKUP] - Pre-fetch matching agent IDs and project IDs for precise filtering
      const [matchingAgentsResult, matchingProjectsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id")
          .ilike("full_name", `%${fuzzyQuery}%`),
        supabase
          .from("projects")
          .select("id")
          .or(`name->>th.ilike.%${fuzzyQuery}%,name->>en.ilike.%${fuzzyQuery}%,name->>cn.ilike.%${fuzzyQuery}%,slug.ilike.%${fuzzyQuery}%`),
      ]);

      const agentIds = matchingAgentsResult.data?.map((a: any) => a.id) || [];
      const projectIds = matchingProjectsResult.data?.map((p: any) => p.id) || [];

      // Base Text Conditions
      let conditions = [
        `title.ilike.%${fuzzyQuery}%`,
        `popular_area.ilike.%${fuzzyQuery}%`,
        `district.ilike.%${fuzzyQuery}%`,
        `province.ilike.%${fuzzyQuery}%`,
        `address_line1.ilike.%${fuzzyQuery}%`
      ];

      // Project Search: match properties belonging to the searched project
      if (projectIds.length > 0) {
        conditions.push(`project_id.in.(${projectIds.map((id: string) => `"${id}"`).join(",")})`);
      }

      // ID Search
      const isHexFragment = /^[0-9a-fA-F-]+$/.test(cleanQuery);
      if (isHexFragment) {
        conditions.unshift(isREF ? `id.ilike.${cleanQuery}%` : `id.ilike.%${cleanQuery}%`);
      }

      // Agent Search
      if (agentIds.length > 0) {
        conditions.push(`assigned_to.in.(${agentIds.map((id: string) => `"${id}"`).join(",")})`);
      }

      // Intelligent Mapping Conditions
      const smartFilters: string[] = [];
      const isSale = tokens.some(t => t.includes("ขาย"));
      const isRent = tokens.some(t => t.includes("เช่า"));
      if (isSale) smartFilters.push(`listing_type.in.("SALE","SALE_AND_RENT")`);
      if (isRent) smartFilters.push(`listing_type.in.("RENT","SALE_AND_RENT")`);
      // Map Property Types
      if (tokens.some(t => t.includes("คอนโด"))) smartFilters.push(`property_type.eq.CONDO`);
      if (tokens.some(t => t.includes("บ้าน") || t.includes("เดี่ยว"))) smartFilters.push(`property_type.eq.HOUSE`);
      if (tokens.some(t => t.includes("ทาวน์"))) smartFilters.push(`property_type.eq.TOWNHOME`);
      if (tokens.some(t => t.includes("พูลวิลล่า"))) smartFilters.push(`property_type.eq.POOL_VILLA`);
      else if (tokens.some(t => t.includes("วิลล่า"))) smartFilters.push(`property_type.eq.VILLA`);
      
      if (tokens.some(t => t.includes("ที่ดิน"))) smartFilters.push(`property_type.eq.LAND`);
      if (tokens.some(t => t.includes("พาณิชย์") || t.includes("ตึกแถว") || t.includes("shophouse"))) smartFilters.push(`property_type.eq.COMMERCIAL_BUILDING`);
      if (tokens.some(t => t.includes("ออฟฟิศ") || t.includes("สำนักงาน") || t.includes("office"))) smartFilters.push(`property_type.eq.OFFICE_BUILDING`);
      if (tokens.some(t => t.includes("โกดัง") || t.includes("โรงงาน") || t.includes("warehouse"))) smartFilters.push(`property_type.eq.WAREHOUSE`);
      if (tokens.some(t => t.includes("อื่นๆ") || t.includes("other"))) smartFilters.push(`property_type.eq.OTHER`);
      if (tokens.some(t => t.includes("พาณิชย์"))) smartFilters.push(`property_type.eq.COMMERCIAL`);

      let finalOr = conditions.join(",");
      if (smartFilters.length > 0) {
        finalOr = `${finalOr},and(${smartFilters.join(",")})`;
      }

      return q.or(finalOr).limit(10);
    })(),

    // 2. Leads - Search by name, phone, email and partial ID
    (() => {
      let q = getBaseQuery("leads", "id, full_name, phone, email");
      if (isUUID) return q.eq("id", cleanQuery);
      
      let conditions = [
        `full_name.ilike.%${fuzzyQuery}%`,
        `phone.ilike.%${fuzzyQuery}%`,
        `email.ilike.%${fuzzyQuery}%`
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

    // 3. Deals - Search by deal ID (only valid when query is UUID)
    (isUUID 
      ? getBaseQuery("deals", "id, property:properties(title)").eq("id", cleanQuery).limit(5)
      : supabase.from("deals").select("id, property:properties(title)").limit(0)
    ),

    // 4. Agents (Profiles)
    supabase.from("profiles")
      .select("id, full_name, email, phone")
      .or(`full_name.ilike.%${cleanQuery}%,email.ilike.%${cleanQuery}%,phone.ilike.%${cleanQuery}%`)
      .limit(5),

    // 5. Owners (search by full_name or phone)
    (isUUID 
      ? getBaseQuery("owners", "id, full_name, phone").eq("id", cleanQuery)
      : getBaseQuery("owners", "id, full_name, phone")
          .or(`full_name.ilike.%${fuzzyQuery}%,phone.ilike.%${fuzzyQuery}%`)
    ).limit(5),
  ]);

  const results: SearchResult[] = [];

  // Map Results with type safety
  if (propertiesRes.data) {
    (propertiesRes.data as unknown as any[]).forEach((p: any) => {
      const projectName = typeof p.projects?.name === "object"
        ? p.projects?.name?.th || p.projects?.name?.en || p.projects?.name?.default || ""
        : typeof p.projects?.name === "string"
        ? p.projects?.name
        : "";

      const locationInfo = p.popular_area || p.district || "ไม่ระบุทำเล";
      const projectInfo = projectName ? ` | 🏢 ${projectName}` : "";

      results.push({
        id: p.id,
        type: "property",
        title: p.title || "ไม่ระบุชื่อทรัพย์",
        subtitle: `REF: #${p.id.slice(0, 8)}${projectInfo} | ${locationInfo}`,
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
        subtitle: o.phone || undefined,
        url: `/protected/owners/${o.id}`,
      });
    });
  }

  return results;
}
