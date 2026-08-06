"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";

export interface SearchResult {
  id: string;
  type: "property" | "lead" | "owner" | "agent";
  title: string;
  subtitle?: string;
  url: string;
}

/**
 * Searches across properties, leads, and owners with a single query.
 */
export async function searchGlobalAction(
  query: string
): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const { supabase, role } = await requireAuthContext();
  assertStaff(role);
  const results: SearchResult[] = [];

  try {
    // Search Properties
    // Search in title, address_line1, district, province
    const propertiesQuery = supabase
      .from("properties")
      .select("id, title, address_line1, district, province, created_by")
      .or(
        `title.ilike.%${query}%,title_en.ilike.%${query}%,address_line1.ilike.%${query}%,address_line1_en.ilike.%${query}%,district.ilike.%${query}%,province.ilike.%${query}%`
      )
      .limit(5);

    const { data: properties } = await propertiesQuery;

    if (properties) {
      properties.forEach((p) => {
        results.push({
          id: p.id || "",
          type: "property",
          title: p.title || "",
          subtitle: p.district || p.address_line1 || undefined,
          url: `/protected/properties/${p.id}`,
        });
      });
    }

    // 2. Search Leads
    const leadsQuery = supabase
      .from("crm_leads_v3")
      .select("id, identity:identities_v3!crm_leads_v3_identity_id_fkey(display_name, phone, email)")
      .or("id.ilike.%" + query + "%")
      .limit(5);

    const { data: leads } = await leadsQuery;

    if (leads) {
      leads.forEach((l) => {
        const ident = l.identity as { display_name?: string; phone?: string; email?: string } | null;
        results.push({
          id: l.id || "",
          type: "lead",
          title: ident?.display_name || "Lead",
          subtitle: ident?.phone || ident?.email || undefined,
          url: `/protected/leads/${l.id}`,
        });
      });
    }

    // 3. Search Owners
    const ownersQuery = supabase
      .from("owners")
      .select("id, full_name, phone, created_by")
      .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(5);

    const { data: owners } = await ownersQuery;

    if (owners) {
      owners.forEach((o) => {
        results.push({
          id: o.id || "",
          type: "owner",
          title: o.full_name || "",
          subtitle: o.phone || undefined,
          url: `/protected/owners/${o.id}`,
        });
      });
    }

    // 4. Search Agents (Profiles)
    const agentsQuery = supabase
      .from("profiles")
      .select("id, full_name, phone, role")
      .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(5);

    const { data: agents } = await agentsQuery;

    if (agents) {
      agents.forEach((a) => {
        results.push({
          id: a.id,
          type: "agent",
          title: a.full_name || "(No name)",
          subtitle: `${a.role === "ADMIN" ? "Admin" : "Agent"}${
            a.phone ? ` • ${a.phone}` : ""
          }`,
          url: `/protected/settings/users`, // Currently no individual agent view, link to list
        });
      });
    }
  } catch (error) {
    console.error("Global search error:", error);
  }

  return results;
}
