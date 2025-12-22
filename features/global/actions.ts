"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext } from "@/lib/authz";

export interface SearchResult {
  id: string;
  type: "property" | "lead" | "owner";
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

  const { supabase, user, role } = await requireAuthContext();
  const results: SearchResult[] = [];

  try {
    // 1. Search Properties
    // Search in title, address_line1, district, province
    let propertiesQuery = supabase
      .from("properties")
      .select("id, title, address_line1, district, created_by")
      .or(
        `title.ilike.%${query}%,address_line1.ilike.%${query}%,district.ilike.%${query}%`
      )
      .limit(5);

    // If not admin, only search own properties
    if (role !== "ADMIN") {
      propertiesQuery = propertiesQuery.eq("created_by", user.id);
    }

    const { data: properties } = await propertiesQuery;

    if (properties) {
      properties.forEach((p) => {
        results.push({
          id: p.id,
          type: "property",
          title: p.title,
          subtitle: p.district || p.address_line1 || undefined,
          url: `/protected/properties/${p.id}`,
        });
      });
    }

    // 2. Search Leads
    let leadsQuery = supabase
      .from("leads")
      .select("id, full_name, phone, email, created_by")
      .or(
        `full_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`
      )
      .limit(5);

    if (role !== "ADMIN") {
      leadsQuery = leadsQuery.eq("created_by", user.id);
    }

    const { data: leads } = await leadsQuery;

    if (leads) {
      leads.forEach((l) => {
        results.push({
          id: l.id,
          type: "lead",
          title: l.full_name,
          subtitle: l.phone || l.email || undefined,
          url: `/protected/leads/${l.id}`,
        });
      });
    }

    // 3. Search Owners
    let ownersQuery = supabase
      .from("owners")
      .select("id, full_name, phone, created_by")
      .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(5);

    if (role !== "ADMIN") {
      ownersQuery = ownersQuery.eq("created_by", user.id);
    }

    const { data: owners } = await ownersQuery;

    if (owners) {
      owners.forEach((o) => {
        results.push({
          id: o.id,
          type: "owner",
          title: o.full_name,
          subtitle: o.phone || undefined,
          url: `/protected/owners/${o.id}`,
        });
      });
    }
  } catch (error) {
    console.error("Global search error:", error);
  }

  return results;
}
