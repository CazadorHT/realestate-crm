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

  return data.map((owner: any) => ({
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

  const owners = data.map((owner: any) => ({
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
