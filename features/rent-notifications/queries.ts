import { createClient } from "@/lib/supabase/client";

export async function getRentNotificationRules() {
  const supabase = createClient();
  const { data, error } = await (supabase as any)
    .from("rent_notification_rules")
    .select(
      `
      *,
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
  const { data, error } = await (supabase as any)
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
