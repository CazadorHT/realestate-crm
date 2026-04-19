"use server";

import { createAdminClient } from "@/lib/supabase/admin";
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
    const supabase = createAdminClient();

    const { error } = await supabase.from("rent_notification_rules").insert({
      property_id: parsed.property_id,
      line_group_id: parsed.line_group_id,
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
    const supabase = createAdminClient();
    let query = supabase
      .from("rent_notification_rules")
      .update(data)
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
    const supabase = createAdminClient();
    let query = supabase
      .from("rent_notification_rules")
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
    const supabase = createAdminClient();
    let query = supabase
      .from("rent_notification_rules")
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
    const supabase = createAdminClient();
    let query = supabase
      .from("rent_notification_rules")
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
    const supabase = createAdminClient();
    
    // 1. Fetch Rule with Security
    let ruleQuery = supabase
      .from("rent_notification_rules")
      .select(`
        *,
        properties (
          *,
          property_images (image_url, is_cover, sort_order)
        ),
        line_groups (group_id)
      `)
      .eq("id", ruleId);

    if (tenantId && tenantId !== "ALL") {
      ruleQuery = ruleQuery.eq("tenant_id", tenantId);
    }

    const { data: rule, error } = await ruleQuery.single();

    if (error || !rule) throw new Error("Rule not found or access denied");

    // 2. Precise Contract Check (Matching Cron Logic)
    const { data: activeContract, error: contractError } = await supabase
      .from("rental_contracts")
      .select("*, deal:deals!inner(property_id)")
      .eq("deal.property_id", rule.property_id)
      .eq("status", "ACTIVE")
      .gte("end_date", new Date().toISOString().split("T")[0])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (contractError) throw contractError;
    if (!activeContract) throw new Error("No active rental contract found for this property.");

    // 3. Prepare Display Data via Centralized Utility
    const { propertyName, price, coverImageUrl, bedrooms, bathrooms, sizeSqm } = getPropertyDisplayInfo(rule);
    
    const lang = (rule.language as "th" | "en" | "cn") || "th";
    const dateFormat = getLocaleDateFormat(lang);
    
    const monthYear = new Date().toLocaleDateString(dateFormat, {
      month: "long",
      year: "numeric",
    });

    const contractEndDate = activeContract.end_date
      ? new Date(activeContract.end_date).toLocaleDateString(dateFormat, {
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
    await supabase.from("rent_notification_history").insert({
      rule_id: rule.id,
      tenant_id: rule.tenant_id,
      property_id: rule.property_id,
      line_group_id: rule.line_group_id,
      status: "SUCCESS",
      metadata: { is_test: true },
    });

    return { success: true };
  } catch (err: unknown) {
    console.error("Test send error:", err);
    return { success: false, message: mapDbError(err) };
  }
}
