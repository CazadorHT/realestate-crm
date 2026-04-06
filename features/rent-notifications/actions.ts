"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  rentNotificationRuleSchema,
  RentNotificationRuleInput,
} from "./schema";

import { mapDbError } from "@/lib/db-error";
import { generateRentNotificationFlex, getLocaleDateFormat } from "./utils";

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
      is_active: parsed.is_active,
      language: parsed.language,
      tenant_id: parsed.tenant_id,
    });

    if (error) throw error;
    revalidatePath("/protected/rent-notifications");
    return { success: true };
  } catch (err: any) {
    console.error("createRentNotificationRule error:", err);
    return { success: false, message: mapDbError(err) };
  }
}

export async function updateRentNotificationRule(
  id: string,
  data: Partial<RentNotificationRuleInput>,
) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("rent_notification_rules")
      .update(data)
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/protected/rent-notifications");
    return { success: true };
  } catch (err: any) {
    console.error("updateRentNotificationRule error:", err);
    return { success: false, message: mapDbError(err) };
  }
}

export async function deleteRentNotificationRule(id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("rent_notification_rules")
      .delete()
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/protected/rent-notifications");
    return { success: true };
  } catch (err: any) {
    console.error("deleteRentNotificationRule error:", err);
    return { success: false, message: mapDbError(err) };
  }
}

export async function toggleRentNotificationRule(
  id: string,
  isActive: boolean,
) {
  return updateRentNotificationRule(id, { is_active: isActive });
}

export async function deleteRentNotificationRules(ids: string[]) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("rent_notification_rules")
      .delete()
      .in("id", ids);

    if (error) throw error;
    revalidatePath("/protected/rent-notifications");
    return { success: true };
  } catch (err: any) {
    console.error("deleteRentNotificationRules error:", err);
    return { success: false, message: mapDbError(err) };
  }
}

export async function toggleRentNotificationRules(ids: string[], isActive: boolean) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("rent_notification_rules")
      .update({ is_active: isActive })
      .in("id", ids);

    if (error) throw error;
    revalidatePath("/protected/rent-notifications");
    return { success: true };
  } catch (err: any) {
    console.error("toggleRentNotificationRules error:", err);
    return { success: false, message: mapDbError(err) };
  }
}

export async function testSendRentNotification(ruleId: string) {
  // This is a manual trigger for a specific rule
  // We can reuse the logic from the cron job, or just call the LINE API directly here
  // For MVP transparency, let's implement the send logic here again or extract it to a shared lib function later.
  // For now, I will just replicate the send logic lightly.

  try {
    const supabase = createAdminClient();
    const { data: rule, error } = await supabase
      .from("rent_notification_rules")
      .select(
        `
                *,
                properties (
                  title, title_en, title_cn, rental_price, currency,
                  bedrooms, bathrooms, size_sqm,
                  property_images (image_url, is_cover, sort_order),
                  deals (
                    rental_contracts (
                      end_date
                    )
                  )
                ),
                line_groups (group_id)
            `,
      )
      .eq("id", ruleId)
      .single();

    if (error || !rule) throw new Error("Rule not found");

    const property = rule.properties;
    const propertyName =
      (rule.language === "en"
        ? property?.title_en
        : rule.language === "cn"
          ? property?.title_cn
          : property?.title) ||
      property?.title ||
      "Property";

    const price = property?.rental_price
      ? `${property.rental_price.toLocaleString()} ${property?.currency || "THB"}`
      : "-";

    const images = property?.property_images || [];
    const coverImageUrl =
      images.find((img: any) => img.is_cover)?.image_url ||
      images[0]?.image_url ||
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600";

    const lang = (rule.language as "th" | "en" | "cn") || "th";
    const dateFormat = getLocaleDateFormat(lang);
    
    // Test send usually refers to the "Next" month or current month reminder
    const monthYear = new Date().toLocaleDateString(dateFormat, {
      month: "long",
      year: "numeric",
    });

    // Find a contract end date if possible
    const contractEndDate = property?.deals?.[0]?.rental_contracts?.[0]?.end_date 
      ? new Date(property.deals[0].rental_contracts[0].end_date).toLocaleDateString(dateFormat, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "-";

    const message = generateRentNotificationFlex({
      propertyName,
      price,
      coverImageUrl,
      bedrooms: property?.bedrooms || "-",
      bathrooms: property?.bathrooms || "-",
      sizeSqm: property?.size_sqm || "-",
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

    // Log Success to History
    await supabase.from("rent_notification_history").insert({
      rule_id: rule.id,
      tenant_id: rule.tenant_id,
      property_id: rule.property_id,
      line_group_id: rule.line_group_id,
      status: "SUCCESS",
      metadata: { is_test: true },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Test send error:", err);

    // Log Error to History (if rule found)
    // We need to fetch rule separately if we want to log error details when fetch fails
    // But for MVP, if we have rule access we log it.
    // In many cases, if it reaches here and error'd post-fetch, we have rule info.

    return { success: false, message: mapDbError(err) };
  }
}
