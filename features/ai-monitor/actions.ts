"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { revalidatePath } from "next/cache";

export type AiLogInput = {
  model: string;
  feature: string;
  status: "success" | "error";
  errorMessage?: string;
};

export async function logAiUsage(input: AiLogInput) {
  const supabase = await createClient();
  const user = await getCurrentProfile();

  if (!user) return; // Fire and forget for unauthenticated (shouldn't happen in protected actions)

  try {
    await supabase.from("ai_usage_logs").insert({
      model: input.model,
      feature: input.feature,
      status: input.status,
      error_message: input.errorMessage,
      user_id: user.id,
    });
  } catch (error) {
    console.error("Failed to log AI usage:", error);
    // Don't throw, we don't want to break the main feature if logging fails
  }
}

export type AiUsageStats = {
  requestsLastMinute: number;
  requestsLast24Hours: number;
  limitRPM: number;
  isRateLimited: boolean;
};

export async function getAiUsageStats(): Promise<AiUsageStats> {
  const supabase = await createClient();
  const user = await getCurrentProfile();

  if (!user) {
    return {
      requestsLastMinute: 0,
      requestsLast24Hours: 0,
      limitRPM: 2, // Safe default
      isRateLimited: false,
    };
  }

  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(
    now.getTime() - 24 * 60 * 60 * 1000,
  ).toISOString();

  // Get RPM (Requests Per Minute)
  const { count: rpmCount } = await supabase
    .from("ai_usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", oneMinuteAgo);

  // Get RPD (Requests Per Day) for general info
  const { count: rpdCount } = await supabase
    .from("ai_usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", twentyFourHoursAgo);

  // Determine Limit based on Model (assuming mostly using Pro/Flash)
  // Free tier is usually 2-15 RPM depending on model.
  // Pro tier is 60 RPM.
  // We can't easily know the user's billing tier here without config,
  // so we'll estimate or use a config value.
  // Since user switched to 'gemini-pro-latest', let's assume a higher limit if they said they are Pro,
  // BUT effectively we just show what we see.
  // Let's set a conservative visual limit for "Free" users of 2 RPM (Gemini 1.5 Pro Free)
  // or 15 RPM (Gemini Flash Free).
  // If user is Pro (Paid), limit is 60+.

  // For dashboard visualization, we'll default to displaying against a "Free Tier" baseline of 2 RPM for Pro model,
  // unless we detect high volume.

  const currentModelLimit = 60; // Assuming paid/high tier based on "Pro" usage request, or 2 if free.
  // Let's set it to 15 (Flash limit) or 2 (Pro Free Limit).
  // Given user hit 429, they are likely on Free tier.
  // Free Gemini 1.5 Pro = 2 RPM.
  // Free Gemini 1.5 Flash = 15 RPM.

  // Let's use 5 as a safe visual threshold for "Warning" zone if we don't know the model perfectly.
  // Actually, let's return the count and let the UI decide the color.

  const limit = 60; // Displaying as if 60 to allow headroom, but we'll show color warnings.

  return {
    requestsLastMinute: rpmCount || 0,
    requestsLast24Hours: rpdCount || 0,
    limitRPM: limit,
    isRateLimited: false, // We can't really know if Supabase/Google blocked us unless we catch a 429 recently.
  };
}
