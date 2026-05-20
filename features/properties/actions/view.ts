"use server";
import { headers } from "next/headers";
import { getFingerprintFromHeaders } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server";

/**
 * Common bot patterns in User-Agents
 */
const BOT_REGEX = /bot|spider|crawl|slurp|lighthouse|google|bing|yandex|duckduckbot|baiduspider|skypeuripreview|facebookexternalhit|twitterbot|linkedinbot|embedly|quora|pinterest|slackbot|redditbot|applebot|whatsapp|telegrambot/i;

interface IncrementViewResult {
  success: boolean;
  trigger_proactive_agent: boolean;
}

/**
 * Increment property view count with identity tracking
 * Publicly accessible action (no auth required)
 */
export async function incrementPropertyView(propertyId: string) {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";

  // 1. Filter out known bots/crawlers
  if (BOT_REGEX.test(userAgent)) {
    return;
  }

  // 2. Identify the visitor/user
  const visitorId = getFingerprintFromHeaders(headersList);
  
  // Try to get authenticated user if available
  let userId: string | undefined = undefined;
  try {
    const supabaseClient = await createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();
    userId = user?.id; // user?.id is string | undefined
  } catch (e) {
    // Ignore auth errors for public tracking
  }

  const supabase = await createClient();

  // 3. Call the secure database function with identity parameters
  const { data, error } = await supabase.rpc("increment_property_view", {
    p_id: propertyId
  });

  if (error) {
    console.error("Error incrementing view count:", error);
    return;
  }

  // 4. 🔥 Trigger Proactive AI Agent if threshold reached
  // The RPC now returns { success, trigger_proactive_agent, tenant_id }
  const result = (data as any)?.[0];
  
  if (result?.trigger_proactive_agent) {
    const { inngest } = await import("@/lib/inngest/client");
    
    await inngest.send({
      name: "property.proactive_trigger",
      data: {
        propertyId,
        visitorId,
        userId,
        tenantId: result.tenant_id // 🛡️ Zero-Admin: Got from RPC directly
      }
    }).catch(e => console.warn("Inngest proactive trigger skip:", e.message));
  }
}
