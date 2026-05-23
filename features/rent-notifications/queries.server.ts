import { SupabaseClient } from "@supabase/supabase-js";
import { Database as LegacyDatabase } from "@/lib/database.types.generated";
import { RentNotificationRule } from "./types";

export async function getRentNotificationRules(
  page = 1,
  pageSize = 20,
  tenantId?: string | null,
  search: string = "",
) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = (await createClient()) as unknown as SupabaseClient<LegacyDatabase>;
  const offset = (page - 1) * pageSize;

  let query = supabase.from("rent_notification_rules_v3").select(
    `
      id, property_id, channel_id, notification_day, notification_hour, language, is_active, last_sent_at, created_at, tenant_id,
      property:properties_core!inner (
        id, 
        rent_price,
        currency,
        bedrooms,
        bathrooms,
        floor_area,
        details:properties_details(title),
        property_images:property_media_v3(image_url, is_cover),
        deals:crm_deals_v3 (
          transaction_end_date
        )
      ),
      channel:notification_channels_v3!inner (id, platform, external_channel_id, channel_name, picture_url),
      tenant:tenants (name)
    `,
    { count: "exact" },
  );

  if (tenantId && tenantId !== "ALL") {
    query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
  }

  if (search) {
    query = query.or(
      `property.details.title.ilike.%${search}%,channel.channel_name.ilike.%${search}%`,
    );
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error("Error fetching rent notification rules:", error);
    const dbErrorModule = await import("@/lib/db-error");
    throw new Error(dbErrorModule.mapDbError(error));
  }

  const rules = (data || []).map((r: any) => {
    const imagesArr = r.property?.property_images || [];
    const cover = imagesArr.find((img: any) => img.is_cover) || imagesArr[0];

    const deals = (r.property?.deals || []).map((d: any) => ({
      rental_contracts: d.transaction_end_date ? [
        {
          end_date: d.transaction_end_date
        }
      ] : []
    }));

    return {
      id: r.id,
      property_id: r.property_id,
      channel_id: r.channel_id,
      line_group_id: r.channel_id,
      notification_day: r.notification_day ?? 1,
      notification_hour: r.notification_hour,
      language: r.language,
      is_active: r.is_active,
      last_sent_at: r.last_sent_at,
      created_at: r.created_at,
      tenant_id: r.tenant_id,
      properties: r.property ? {
        id: r.property.id,
        title: r.property.details?.title?.th || r.property.details?.title?.en || "Unknown Property",
        rental_price: r.property.rent_price,
        currency: r.property.currency,
        bedrooms: r.property.bedrooms,
        bathrooms: r.property.bathrooms,
        size_sqm: r.property.floor_area,
        property_images: cover ? [{ image_url: cover.image_url }] : [],
        deals: deals
      } : undefined,
      line_groups: r.channel ? {
        group_id: r.channel.id,
        group_name: r.channel.channel_name,
        picture_url: r.channel.picture_url,
        platform: r.channel.platform,
        external_channel_id: r.channel.external_channel_id
      } : null,
      tenants: r.tenant
    };
  }) as unknown as RentNotificationRule[];

  return { rules, count: count || 0 };
}

export async function getLineGroups(tenantId?: string | null) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = (await createClient()) as unknown as SupabaseClient<LegacyDatabase>;

  let query = supabase
    .from("notification_channels_v3")
    .select("id, platform, external_channel_id, channel_name, picture_url")
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
  return (data || []).map((c) => ({
    group_id: c.id,
    group_name: c.channel_name,
    picture_url: c.picture_url,
    platform: c.platform,
    external_channel_id: c.external_channel_id,
  }));
}

export async function getAllPropertiesSimple(tenantId?: string | null) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = (await createClient()) as unknown as SupabaseClient<LegacyDatabase>;

  // Optimized query using NOT EXISTS to filter out properties that already have rules
  // This is much faster than application-level filtering as the property count grows.
  const { data, error } = await supabase.rpc(
    "get_properties_without_notification_rules_v3",
    {
      p_tenant_id: tenantId === "ALL" ? undefined : (tenantId || undefined),
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
      .from("properties_core")
      .select(
        `
        id, 
        details:properties_details(title),
        property_images:property_media_v3(image_url, is_cover),
        deals:crm_deals_v3!inner (
          id,
          status
        )
      `,
      )
      .in("deals.status", ["WON", "CLOSED_WIN"]);

    if (tenantId && tenantId !== "ALL") {
      query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
    }

    const { data: properties, error: propError } = await query.order(
      "created_at",
      { ascending: false },
    );
    if (propError || !properties) return [];

    const { data: rules } = await supabase
      .from("rent_notification_rules_v3")
      .select("property_id");
    const existingIds = new Set((rules || []).map((r: { property_id: string | null }) => r.property_id as string));

    type PropertyWithImages = {
      id: string;
      details?: { title?: { th?: string; en?: string } | null } | null;
      property_images: Array<{ image_url?: string; is_cover?: boolean | null }>;
    };

    return (properties as unknown as PropertyWithImages[])
      .filter((p: PropertyWithImages) => !existingIds.has(p.id))
      .map((p: PropertyWithImages) => {
        const imagesArr = p.property_images || [];
        const cover = imagesArr.find((img) => img.is_cover) || imagesArr[0];
        return {
          id: p.id,
          title: p.details?.title?.th || p.details?.title?.en || "Unknown Property",
          image: cover?.image_url || null,
        };
      });
  }

  const rpcData = (data as unknown as Array<{ id: string; title: string; image_url: string | null }>) || [];
  return rpcData.map((p) => ({
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
  const supabase = (await createClient()) as unknown as SupabaseClient<LegacyDatabase>;
  const offset = (page - 1) * pageSize;

  let query = supabase.from("rent_notification_history_v3").select(
    `
      id, rule_id, property_id, channel_id, sent_at, status, error_message, created_at, tenant_id,
      property:properties_core (
        details:properties_details(title)
      ),
      channel:notification_channels_v3 (channel_name)
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

  const history = (data || []).map((r: any) => ({
    ...r,
    properties: r.property ? {
      title: r.property.details?.title?.th || r.property.details?.title?.en || "Unknown Property"
    } : undefined,
    line_groups: r.channel ? {
      group_name: r.channel.channel_name || "Unknown Group"
    } : undefined
  }));

  return { history, count: count || 0 };
}
