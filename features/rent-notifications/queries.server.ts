export async function getRentNotificationRules(
  page = 1,
  pageSize = 20,
  tenantId?: string | null,
) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const offset = (page - 1) * pageSize;

  let query = supabase.from("rent_notification_rules").select(
    `
      *,
      properties (
        id, 
        title,
        property_images(image_url),
        deals (
          rental_contracts (
            end_date
          )
        )
      ),
      line_groups (group_id, group_name, picture_url),
      tenant:tenants (name)
    `,
    { count: "exact" },
  );

  if (tenantId && tenantId !== "ALL") {
    query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
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
    .select("*")
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

  // 1. Fetch properties with active contracts
  let query = supabase.from("properties").select(
    `
      id,
      title,
      image_url:property_images(image_url),
      deals!inner(
        status,
        rental_contracts!inner(
          status
        )
      )
    `,
  );

  if (tenantId && tenantId !== "ALL") {
    query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
  }

  const { data: properties, error: propError } = await query
    .eq("deals.status", "CLOSED_WIN")
    .eq("deals.rental_contracts.status", "ACTIVE")
    .neq("status", "ARCHIVED")
    .order("created_at", { ascending: false });

  if (propError) {
    console.error("Error fetching properties simple:", propError);
    return [];
  }

  // 2. Fetch existing rules to filter them out
  let rulesQuery = supabase
    .from("rent_notification_rules")
    .select("property_id");

  if (tenantId && tenantId !== "ALL") {
    rulesQuery = rulesQuery.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
  }

  const { data: rules, error: rulesError } = await rulesQuery;

  if (rulesError) {
    console.error("Error fetching existing rules:", rulesError);
    return properties.map((p: any) => ({
      id: p.id,
      title: p.title,
      image:
        Array.isArray(p.image_url) && p.image_url.length > 0
          ? p.image_url[0].image_url
          : null,
    }));
  }

  const existingPropertyIds = new Set(rules.map((r) => r.property_id));

  // 3. Return only properties that DON'T have a rule yet
  return properties
    .filter((p) => !existingPropertyIds.has(p.id))
    .map((p: any) => ({
      id: p.id,
      title: p.title,
      image:
        Array.isArray(p.image_url) && p.image_url.length > 0
          ? p.image_url[0].image_url
          : null,
    }));
}
