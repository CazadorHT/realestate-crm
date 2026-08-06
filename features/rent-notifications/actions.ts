"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  rentNotificationRuleSchema,
  RentNotificationRuleInput,
} from "./schema";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { mapDbError } from "@/lib/db-error";
import { generateRentNotificationFlex, getLocaleDateFormat, getPropertyDisplayInfo } from "./utils";

async function checkPropertyAccess(supabase: any, user: any, role: string, propertyId: string) {
  const canBypass = role === "ADMIN" || role === "MANAGER";
  if (canBypass) return true;

  const { data: prop, error } = await supabase
    .from("properties_core")
    .select("created_by, assigned_to")
    .eq("id", propertyId)
    .single();

  if (error || !prop) {
    throw new Error("ไม่พบข้อมูลทรัพย์สินที่ระบุ");
  }

  const isOwner = prop.created_by === user.id || prop.assigned_to === user.id;
  if (!isOwner) {
    throw new Error("คุณไม่มีสิทธิ์จัดการกฎการแจ้งเตือนสำหรับทรัพย์สินของผู้อื่น");
  }
  return true;
}

async function checkRuleAccess(supabase: any, user: any, role: string, ruleId: string) {
  const { data: rule, error } = await supabase
    .from("rent_notification_rules_v3")
    .select("property_id")
    .eq("id", ruleId)
    .single();

  if (error || !rule) {
    throw new Error("ไม่พบกฎการแจ้งเตือนที่ต้องการ");
  }

  await checkPropertyAccess(supabase, user, role, rule.property_id);
}

async function checkRulesAccess(supabase: any, user: any, role: string, ruleIds: string[]) {
  const { data: rules, error } = await supabase
    .from("rent_notification_rules_v3")
    .select("property_id")
    .in("id", ruleIds);

  if (error || !rules) {
    throw new Error("ไม่พบกฎการแจ้งเตือนที่ต้องการ");
  }

  for (const rule of rules) {
    await checkPropertyAccess(supabase, user, role, rule.property_id);
  }
}

export async function createRentNotificationRule(
  data: RentNotificationRuleInput,
) {
  try {
     const { supabase, user, role } = await requireAuthContext();
     assertStaff(role);

     const parsed = rentNotificationRuleSchema.parse(data);
     if (!parsed.property_id) {
       return { success: false, message: "กรุณาระบุรหัสทรัพย์สิน" };
     }

     let tenantIdToUse = parsed.tenant_id;
     if (!tenantIdToUse || tenantIdToUse === "ALL") {
       const { data: prop } = await supabase
         .from("properties_core")
         .select("tenant_id")
         .eq("id", parsed.property_id)
         .single();
       if (prop?.tenant_id) {
         tenantIdToUse = prop.tenant_id;
       }
     }

     if (!tenantIdToUse || tenantIdToUse === "ALL") {
       return { success: false, message: "กรุณาระบุรหัสสาขา" };
     }

     await checkPropertyAccess(supabase, user, role, parsed.property_id);

     let targetChannelId = parsed.line_group_id;

     // If the selected group ID is not a UUID, it means it is a raw line group from line_groups
     const isUuid = /^[0-9a-fA-F-]{36}$/.test(targetChannelId);
     if (!isUuid) {
       const { data: groupDetail } = await supabase
         .from("line_groups")
         .select("group_id, group_name, picture_url")
         .eq("group_id", targetChannelId)
         .maybeSingle();

       const groupName = parsed.custom_group_name || groupDetail?.group_name || "LINE Group";
       const pictureUrl = groupDetail?.picture_url || null;

       const { data: newChannel, error: channelInsertError } = await supabase
         .from("notification_channels_v3")
         .insert({
           tenant_id: tenantIdToUse,
           platform: "LINE",
           external_channel_id: targetChannelId,
           channel_name: groupName,
           picture_url: pictureUrl,
           is_active: true,
         })
         .select("id")
         .single();

       if (channelInsertError) {
         console.error("Failed to migrate LINE group to channels:", channelInsertError);
         throw channelInsertError;
       }
       
       targetChannelId = newChannel.id;

       // Also update name in the raw line_groups table for future references
       if (parsed.custom_group_name) {
         await supabase
           .from("line_groups")
           .update({ group_name: parsed.custom_group_name })
           .eq("group_id", groupDetail?.group_id || targetChannelId);
       }
     } else if (parsed.custom_group_name) {
       // If it is already registered, update name in both tables
       const { data: channelDetail } = await supabase
         .from("notification_channels_v3")
         .update({ channel_name: parsed.custom_group_name })
         .eq("id", targetChannelId)
         .select("external_channel_id")
         .maybeSingle();

       if (channelDetail?.external_channel_id) {
         await supabase
           .from("line_groups")
           .update({ group_name: parsed.custom_group_name })
           .eq("group_id", channelDetail.external_channel_id);
       }
     }

     const { error } = await supabase.from("rent_notification_rules_v3").insert({
       property_id: parsed.property_id,
       channel_id: targetChannelId,
       notification_day: parsed.notification_day,
       notification_hour: parsed.notification_hour,
       is_active: parsed.is_active,
       language: parsed.language,
       tenant_id: tenantIdToUse,
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
     const { supabase, user, role } = await requireAuthContext();
     assertStaff(role);

     const { data: existingRule } = await supabase
       .from("rent_notification_rules_v3")
       .select("channel_id")
       .eq("id", id)
       .single();

     await checkRuleAccess(supabase, user, role, id);

     const updateData: any = { ...data };
     if (updateData.custom_group_name && existingRule) {
       let channelId = existingRule.channel_id;
       // Update the channel name
       const { data: channelDetail } = await supabase
         .from("notification_channels_v3")
         .update({ channel_name: updateData.custom_group_name })
         .eq("id", channelId)
         .select("external_channel_id")
         .maybeSingle();

       if (channelDetail?.external_channel_id) {
         await supabase
           .from("line_groups")
           .update({ group_name: updateData.custom_group_name })
           .eq("group_id", channelDetail.external_channel_id);
       }
       delete updateData.custom_group_name;
     }

     if (updateData.line_group_id) {
       let targetChannelId = updateData.line_group_id;
       const isUuid = /^[0-9a-fA-F-]{36}$/.test(targetChannelId);

       if (!isUuid && tenantId) {
         const { data: groupDetail } = await supabase
           .from("line_groups")
           .select("group_id, group_name, picture_url")
           .eq("group_id", targetChannelId)
           .maybeSingle();

         const groupName = updateData.custom_group_name || groupDetail?.group_name || "LINE Group";
         const pictureUrl = groupDetail?.picture_url || null;

         const { data: newChannel, error: channelInsertError } = await supabase
           .from("notification_channels_v3")
           .insert({
             tenant_id: tenantId,
             platform: "LINE",
             external_channel_id: targetChannelId,
             channel_name: groupName,
             picture_url: pictureUrl,
             is_active: true,
           })
           .select("id")
           .single();

         if (channelInsertError) {
           console.error("Failed to migrate LINE group to channels:", channelInsertError);
           throw channelInsertError;
         }
         
         targetChannelId = newChannel.id;
       }

       updateData.channel_id = targetChannelId;
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
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    await checkRuleAccess(supabase, user, role, id);

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
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    await checkRulesAccess(supabase, user, role, ids);

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
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    await checkRulesAccess(supabase, user, role, ids);

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
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    await checkRuleAccess(supabase, user, role, ruleId);
    
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
        title: (rawRule.properties.details as any)?.title?.th || (rawRule.properties.details as any)?.title?.en || "Unknown Property",
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
        to: rawRule.channel.external_channel_id,
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
    } as any);

    return { success: true };
  } catch (err: unknown) {
    console.error("Test send error:", err);
    return { success: false, message: mapDbError(err) };
  }
}
