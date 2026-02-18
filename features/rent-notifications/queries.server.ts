export async function getRentNotificationRules() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rent_notification_rules")
    .select(
      `
      *,
      properties (
        id, 
        title,
        deals (
          rental_contracts (
            end_date
          )
        )
      ),
      line_groups (group_id, group_name, picture_url)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching rules:", error);
    return [];
  }
  return data;
}

export async function getLineGroups() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  // Fetch only active groups or all? Let's fetch all for now or active.
  const { data, error } = await supabase
    .from("line_groups")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching line groups:", error);
    return [];
  }
  return data;
}

export async function getAllPropertiesSimple() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  // 1. Fetch properties with active contracts
  const { data: properties, error: propError } = await supabase
    .from("properties")
    .select(
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
    )
    .eq("deals.status", "CLOSED_WIN")
    .eq("deals.rental_contracts.status", "ACTIVE")
    .neq("status", "ARCHIVED")
    .order("created_at", { ascending: false });

  if (propError) {
    console.error("Error fetching properties simple:", propError);
    return [];
  }

  // 2. Fetch existing rules to filter them out
  const { data: rules, error: rulesError } = await supabase
    .from("rent_notification_rules")
    .select("property_id");

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
