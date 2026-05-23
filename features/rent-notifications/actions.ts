"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  rentNotificationRuleSchema,
  RentNotificationRuleInput,
} from "./schema";

import { mapDbError } from "@/lib/db-error";
import { generateRentNotificationFlex, getLocaleDateFormat, getPropertyDisplayInfo } from "./utils";

export async function createRentNotificationRule(
  data: RentNotificationRuleInput,
) {
  try {
    const parsed = rentNotificationRuleSchema.parse(data);
    const supabase = await createClient();

    const { error } = await supabase.from("rent_notification_rules_v3").insert({
      property_id: parsed.property_id,
      channel_id: parsed.line_group_id,
      notification_day: parsed.notification_day,
      notification_hour: parsed.notification_hour,
      is_active: parsed.is_active,
      language: parsed.language,
      tenant_id: parsed.tenant_id,
    });

    if (error) throw error;
    revalidatePath("/protected/rent-notifications");
    return { success: true };
  } catch (err: unknown) {
    console.error("createRentNotificationRule error:", err);
    return { success: false, message: mapDbError(err) };
  }
}

export async function updateRentNotificationRule(
  id: string,
  data: Partial<RentNotificationRuleInput>,
  tenantId?: string | null,
) {
  try {
    const supabase = await createClient();
    const updateData: any = { ...data };
    if (updateData.line_group_id) {
      updateData.channel_id = updateData.line_group_id;
      delete updateData.line_group_id;
    }

    let query = supabase
      .from("rent_notification_rules_v3")
      .update(updateData)
      .eq("id", id);
    
    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { error } = await query;

    if (error) throw error;
    revalidatePath("/protected/rent-notifications");
    return { success: true };
  } catch (err: unknown) {
    console.error("updateRentNotificationRule error:", err);
    return { success: false, message: mapDbError(err) };
  }
}

export async function deleteRentNotificationRule(id: string, tenantId?: string | null) {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("rent_notification_rules_v3")
      .delete()
      .eq("id", id);

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { error } = await query;

    if (error) throw error;
    revalidatePath("/protected/rent-notifications");
    return { success: true };
  } catch (err: unknown) {
    console.error("deleteRentNotificationRule error:", err);
    return { success: false, message: mapDbError(err) };
  }
}

export async function toggleRentNotificationRule(
  id: string,
  isActive: boolean,
  tenantId?: string | null,
) {
  return updateRentNotificationRule(id, { is_active: isActive }, tenantId);
}

export async function deleteRentNotificationRules(ids: string[], tenantId?: string | null) {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("rent_notification_rules_v3")
      .delete()
      .in("id", ids);

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { error } = await query;

    if (error) throw error;
    revalidatePath("/protected/rent-notifications");
    return { success: true };
  } catch (err: unknown) {
    console.error("deleteRentNotificationRules error:", err);
    return { success: false, message: mapDbError(err) };
  }
}

export async function toggleRentNotificationRules(ids: string[], isActive: boolean, tenantId?: string | null) {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("rent_notification_rules_v3")
      .update({ is_active: isActive })
      .in("id", ids);

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { error } = await query;

    if (error) throw error;
    revalidatePath("/protected/rent-notifications");
    return { success: true };
  } catch (err: unknown) {
    console.error("toggleRentNotificationRules error:", err);
    return { success: false, message: mapDbError(err) };
  }
}

export async function testSendRentNotification(ruleId: string, tenantId?: string | null) {
  try {
    const supabase = await createClient();
    
    // 1. Fetch Rule with Security
    let ruleQuery = supabase
      .from("rent_notification_rules_v3")
      .select(`
        id, property_id, channel_id, notification_day, notification_hour, language, is_active, last_sent_at, created_at, tenant_id,
        properties:properties_core!inner (
          id, 
          rent_price,
          currency,
          bedrooms,
          bathrooms,
          floor_area,
          details:properties_details(title),
          property_images:property_media_v3(image_url:url, is_cover)
        ),
        channel:notification_channels_v3!inner (id, platform, external_channel_id, channel_name, picture_url)
      `)
      .eq("id", ruleId);

    if (tenantId && tenantId !== "ALL") {
      ruleQuery = ruleQuery.eq("tenant_id", tenantId);
    }

    const { data: rawRule, error } = await ruleQuery.single();

    if (error || !rawRule) throw new Error("Rule not found or access denied");

    const imagesArr = rawRule.properties?.property_images || [];
    const cover = imagesArr.find((img: any) => img.is_cover) || imagesArr[0];

    const rule = {
      ...rawRule,
      line_group_id: rawRule.channel_id,
      properties: rawRule.properties ? {
        id: rawRule.properties.id,
        title: rawRule.properties.details?.title?.th || rawRule.properties.details?.title?.en || "Unknown Property",
        rental_price: rawRule.properties.rent_price,
        currency: rawRule.properties.currency,
        bedrooms: rawRule.properties.bedrooms,
        bathrooms: rawRule.properties.bathrooms,
        size_sqm: rawRule.properties.floor_area,
        property_images: cover ? [{ image_url: cover.image_url }] : []
      } : undefined
    };

    // 2. Precise Contract Check (Matching Cron Logic)
    const { data: activeContract, error: contractError } = await supabase
      .from("crm_deals_v3")
      .select("id, tenant_id, transaction_date, transaction_end_date, total_amount, status, created_at, metadata, property_id")
      .eq("property_id", rule.property_id)
      .eq("deal_type", "RENT")
      .in("status", ["WON", "CLOSED_WIN"])
      .gte("transaction_end_date", new Date().toISOString().split("T")[0])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (contractError) throw contractError;
    if (!activeContract) throw new Error("No active rental contract found for this property.");

    // 3. Prepare Display Data via Centralized Utility
    const { propertyName, price, coverImageUrl, bedrooms, bathrooms, sizeSqm } = getPropertyDisplayInfo(rule);
    
    const lang = (rule.language as "th" | "en" | "cn" | "ru") || "th";
    const dateFormat = getLocaleDateFormat(lang);
    
    const monthYear = new Date().toLocaleDateString(dateFormat, {
      month: "long",
      year: "numeric",
    });

    const contractEndDate = activeContract.transaction_end_date
      ? new Date(activeContract.transaction_end_date).toLocaleDateString(dateFormat, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "-";

    const message = generateRentNotificationFlex({
      propertyName,
      price,
      coverImageUrl,
      bedrooms,
      bathrooms,
      sizeSqm,
      monthYear,
      contractEndDate,
      language: lang,
      isTest: true,
    });

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) throw new Error("Missing LINE Token");

    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: rule.line_group_id,
        messages: [message],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`LINE API Error: ${response.status} - ${errorBody}`);
    }

    // 4. Log Success to History
    await supabase.from("rent_notification_history_v3").insert({
      rule_id: rule.id,
      tenant_id: rule.tenant_id,
      property_id: rule.property_id,
      channel_id: rule.channel_id,
      status: "SUCCESS",
      metadata: { is_test: true },
    });

    return { success: true };
  } catch (err: unknown) {
    console.error("Test send error:", err);
    return { success: false, message: mapDbError(err) };
  }
}
