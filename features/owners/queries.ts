import { createClient } from "@/lib/supabase/server";
import type { Owner } from "./types";

export async function getOwnerById(id: string): Promise<Owner | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("owners")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching owner:", error);
    return null;
  }

  return data;
}

export async function getOwners() {
  const supabase = await createClient();

  // Fetch owners with property count
  const { data, error } = await supabase
    .from("owners")
    .select(
      `
      *,
      properties:properties(count)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching owners:", error);
    return [];
  }

  type OwnerWithCount = Owner & { properties: { count: number }[] };
  const owners = data as unknown as OwnerWithCount[];

  return owners.map((owner) => ({
    ...owner,
    property_count: owner.properties?.[0]?.count || 0,
  }));
}

export async function getOwnerProperties(ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching owner properties:", error);
    return [];
  }

  return data || [];
}

export type GetOwnersParams = {
  q?: string;
  page?: number;
  pageSize?: number;
};

export async function getOwnersQuery({
  q,
  page = 1,
  pageSize = 10,
}: GetOwnersParams) {
  const supabase = await createClient();
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let query = supabase
    .from("owners")
    .select("*, properties:properties(count)", { count: "exact" });

  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,phone.ilike.%${q}%,line_id.ilike.%${q}%`
    );
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error) {
    console.error("Error fetching owners query:", error);
    return { data: [], count: 0, pageSize, page, totalPages: 0 };
  }

  type OwnerWithCount = Owner & { properties: { count: number }[] };
  const rawOwners = data as unknown as OwnerWithCount[];

  const owners = rawOwners.map((owner) => ({
    ...owner,
    property_count: owner.properties?.[0]?.count || 0,
  }));

  return {
    data: owners,
    count: count || 0,
    pageSize,
    page,
    totalPages: count ? Math.ceil(count / pageSize) : 0,
  };
}

export async function getOwnersDashboardStatsQuery() {
  const supabase = await createClient();

  // 1. Total Owners
  const { count: totalOwners } = await supabase
    .from("owners")
    .select("*", { count: "exact", head: true });

  // 2. New this month
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();
  const { count: newOwnersMonth } = await supabase
    .from("owners")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth);

  // 3. Owners with properties (Active)
  // This is a bit tricky with simple query, but we can check distinct owner_id in properties
  const { count: activeOwners } = await supabase
    .from("properties")
    .select("owner_id", { count: "exact", head: true });
  // This is property count, not unique owner count.
  // Better approximation: fetch all distinct owner_ids from properties?
  // Or just "Total Properties" owned by these owners?
  // User probably cares about "How many owners have at least 1 property".
  // For now, let's just show "Total Properties" linked to owners.

  const { count: totalPropertiesLinked } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .not("owner_id", "is", null);

  return {
    totalOwners: totalOwners || 0,
    newOwnersMonth: newOwnersMonth || 0,
    totalPropertiesLinked: totalPropertiesLinked || 0,
  };
}
