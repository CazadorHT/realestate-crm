import { createClient } from "@/lib/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database as LegacyDatabase } from "@/lib/database.types.generated";

export async function getRentNotificationRules() {
  const supabase = createClient() as unknown as SupabaseClient<LegacyDatabase>;
  const { data, error } = await supabase
    .from("rent_notification_rules_v3")
    .select(
      `
      id, property_id, channel_id, notification_day, notification_hour, language, is_active, last_sent_at, created_at, tenant_id,
      property:properties_core (
        id,
        details:properties_details(title)
      ),
      channel:notification_channels_v3 (id, platform, external_channel_id, channel_name, picture_url)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching rules:", error);
    return [];
  }
  
  return (data || []).map((r: any) => ({
    ...r,
    line_group_id: r.channel_id,
    properties: r.property ? {
      id: r.property.id,
      title: r.property.details?.title?.th || r.property.details?.title?.en || "Unknown Property",
    } : undefined,
    line_groups: r.channel ? {
      group_id: r.channel.id,
      group_name: r.channel.channel_name,
      picture_url: r.channel.picture_url,
      platform: r.channel.platform,
      external_channel_id: r.channel.external_channel_id
    } : null,
  }));
}

export async function getLineGroups() {
  const supabase = createClient() as unknown as SupabaseClient<LegacyDatabase>;
  // Fetch only active groups or all? Let's fetch all for now or active.
  const { data, error } = await supabase
    .from("notification_channels_v3")
    .select("id, platform, external_channel_id, channel_name, picture_url, is_active")
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching line groups:", error);
    return [];
  }
  
  return (data || []).map((c) => ({
    group_id: c.id,
    group_name: c.channel_name,
    picture_url: c.picture_url,
    platform: c.platform,
    external_channel_id: c.external_channel_id,
  }));
}
