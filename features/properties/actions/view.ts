"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";

/**
 * Common bot patterns in User-Agents
 */
const BOT_REGEX = /bot|spider|crawl|slurp|lighthouse|google|bing|yandex|duckduckbot|baiduspider|skypeuripreview|facebookexternalhit|twitterbot|linkedinbot|embedly|quora|pinterest|slackbot|redditbot|applebot|whatsapp|telegrambot/i;

/**
 * Increment property view count
 * Publicly accessible action (no auth required)
 */
export async function incrementPropertyView(propertyId: string) {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";

  // Filter out known bots/crawlers
  if (BOT_REGEX.test(userAgent)) {
    return;
  }

  const supabase = createAdminClient();

  // Call the secure database function
  const { error } = await supabase.rpc("increment_property_view", {
    property_id: propertyId,
  });

  if (error) {
    console.error("Error incrementing view count:", error);
  }
}
