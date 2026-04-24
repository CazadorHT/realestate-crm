import { createClient } from "@/lib/supabase/client";

export async function getRentNotificationRules() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rent_notification_rules")
    .select(
      `
      id, property_id, line_group_id, notification_day, notification_hour, language, is_active, last_sent_at, created_at, tenant_id,
      properties (id, title),
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
  const supabase = createClient();
  // Fetch only active groups or all? Let's fetch all for now or active.
  const { data, error } = await supabase
    .from("line_groups")
    .select("group_id, group_name, picture_url, is_active")
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching line groups:", error);
    return [];
  }
  return data;
}
