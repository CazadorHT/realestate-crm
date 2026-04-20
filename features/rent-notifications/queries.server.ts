import { Database } from "@/lib/database.types";
type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

export async function getRentNotificationRules(
  page = 1,
  pageSize = 20,
  tenantId?: string | null,
  search: string = "",
) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const offset = (page - 1) * pageSize;

  let query = supabase.from("rent_notification_rules").select(
    `
      *,
      properties!inner (
        id, 
        title,
        property_images(image_url),
        deals (
          rental_contracts (
            end_date
          )
        )
      ),
      line_groups!inner (group_id, group_name, picture_url),
      tenant:tenants (name)
    `,
    { count: "exact" },
  );

  if (tenantId && tenantId !== "ALL") {
    query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
  }

  if (search) {
    query = query.or(
      `properties.title.ilike.%${search}%,line_groups.group_name.ilike.%${search}%`,
    );
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error("Error fetching rent notification rules:", error);
    throw new Error(require("@/lib/db-error").mapDbError(error));
  }

  return { rules: data || [], count: count || 0 };
}

export async function getLineGroups(tenantId?: string | null) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  let query = supabase
    .from("line_groups")
    .select("group_id, group_name, picture_url")
    .eq("is_active", true);

  if (tenantId && tenantId !== "ALL") {
    query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
  }

  const { data, error } = await query.order("updated_at", {
    ascending: false,
  });

  if (error) {
    console.error("Error fetching line groups:", error);
    return [];
  }
  return data;
}

export async function getAllPropertiesSimple(tenantId?: string | null) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  // Optimized query using NOT EXISTS to filter out properties that already have rules
  // This is much faster than application-level filtering as the property count grows.
  const { data, error } = await supabase.rpc(
    "get_properties_without_notification_rules",
    {
      p_tenant_id: tenantId === "ALL" ? null : tenantId || null,
    },
  );

  if (error) {
    // Fallback to manual filtering if RPC is not yet available, though we should prefer the RPC/SQL
    console.warn(
      "RPC get_properties_without_notification_rules failed, falling back to manual filtering:",
      error,
    );

    // 1. Fetch properties with active contracts
    let query = supabase
      .from("properties")
      .select(
        `
        id, 
        title,
        property_images(image_url),
        deals!inner (
          id,
          status,
          rental_contracts!inner (
            id,
            status
          )
        )
      `,
      )
      .eq("deals.status", "CLOSED_WIN")
      .eq("deals.rental_contracts.status", "ACTIVE")
      .neq("status", "ARCHIVED");

    if (tenantId && tenantId !== "ALL") {
      query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
    }

    const { data: properties, error: propError } = await query.order(
      "created_at",
      { ascending: false },
    );
    if (propError || !properties) return [];

    const { data: rules } = await supabase
      .from("rent_notification_rules")
      .select("property_id");
    const existingIds = new Set((rules || []).map((r: { property_id: string }) => r.property_id));

    type PropertyWithImages = {
      id: string;
      title: string | null;
      images: Array<{ url: string; image_url?: string; is_cover: boolean | null }>;
    };

    return (properties as unknown as PropertyWithImages[])
      .filter((p: PropertyWithImages) => !existingIds.has(p.id))
      .map((p: PropertyWithImages) => {
        const imagesArr = p.images || [];
        const cover = imagesArr.find((img) => img.is_cover) || imagesArr[0];
        return {
          id: p.id,
          title: p.title || "Unknown Property",
          image: cover?.url || cover?.image_url || null,
        };
      });
  }

  return (data as any[] || []).map((p: { id: string; title: string; image_url: string | null }) => ({
    id: p.id,
    title: p.title,
    image: p.image_url,
  }));
}

export async function getRentNotificationHistory(
  page = 1,
  pageSize = 20,
  tenantId?: string | null,
) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const offset = (page - 1) * pageSize;

  let query = supabase.from("rent_notification_history").select(
    `
      *,
      properties (title),
      line_groups (group_name)
    `,
    { count: "exact" },
  );

  if (tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error("Error fetching notification history:", error);
    return { history: [], count: 0 };
  }

  return { history: data || [], count: count || 0 };
}
