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
  const supabase = createClient() as any;
  // 1. Fetch registered channels in notification_channels_v3
  const { data: channels, error: channelsError } = await supabase
    .from("notification_channels_v3")
    .select("id, platform, external_channel_id, channel_name, picture_url, is_active")
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  if (channelsError) {
    console.error("Error fetching line channels:", channelsError);
  }

  // 2. Fetch unclaimed groups from line_groups
  const { data: rawGroups, error: groupsError } = await supabase
    .from("line_groups")
    .select("group_id, group_name, picture_url");

  if (groupsError) {
    console.error("Error fetching raw line groups:", groupsError);
  }

  const result: any[] = [];
  const registeredExternals = new Set<string>();

  // Add registered channels first
  (channels || []).forEach((c: any) => {
    registeredExternals.add(c.external_channel_id);
    result.push({
      group_id: c.id, // We use the UUID as the selection ID
      group_name: c.channel_name,
      picture_url: c.picture_url,
      platform: c.platform,
      external_channel_id: c.external_channel_id,
      is_registered: true,
    });
  });

  // Add unclaimed groups that are not already registered
  (rawGroups || []).forEach((g: any) => {
    if (!registeredExternals.has(g.group_id)) {
      result.push({
        group_id: g.group_id, // We use the LINE external ID as the selection ID
        group_name: g.group_name,
        picture_url: g.picture_url,
        platform: "LINE",
        external_channel_id: g.group_id,
        is_registered: false,
      });
    }
  });

  return result;
}
