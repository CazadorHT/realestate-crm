"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { revalidatePath } from "next/cache";

export type AiLogInput = {
  model: string;
  feature: string;
  status: "success" | "error";
  errorMessage?: string;
};

export async function logAiUsage(input: AiLogInput) {
  const adminClient = createAdminClient();
  const user = await getCurrentProfile();

  try {
    console.log(
      `[AI_LOG] Logging feature: ${input.feature}, model: ${input.model}`,
    );
    const { data, error } = await adminClient.from("ai_usage_logs").insert({
      model: input.model,
      feature: input.feature,
      status: input.status,
      error_message: input.errorMessage,
      user_id: user?.id || null, // Allow anonymous logging
    });

    if (error) {
      console.error("[AI_LOG] Insert Error:", error);
    } else {
      console.log("[AI_LOG] Successfully inserted log record");
    }

    // Lazy Cleanup: 10% chance to prune logs older than 30 days
    if (Math.random() < 0.1) {
      pruneAiLogs(30).catch(console.error);
    }
  } catch (error) {
    console.error("[AI_LOG] Failed to log AI usage (Exception):", error);
  }
}

export async function pruneAiLogs(daysToKeep: number = 30) {
  const adminClient = createAdminClient();
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - daysToKeep);

  const { error } = await adminClient
    .from("ai_usage_logs")
    .delete()
    .lt("created_at", dateThreshold.toISOString());

  if (error) {
    console.error("Failed to prune AI logs:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export type AiUsageStats = {
  requestsLastMinute: number;
  requestsLast24Hours: number;
  limitRPM: number;
  isRateLimited: boolean;
};

export async function getAiUsageStats(): Promise<AiUsageStats> {
  const user = await getCurrentProfile();
  // Using admin client for counting ensures accurate global stats for admins/monitors
  const client =
    user?.role === "ADMIN" ? createAdminClient() : await createClient();

  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(
    now.getTime() - 24 * 60 * 60 * 1000,
  ).toISOString();

  let query = client
    .from("ai_usage_logs")
    .select("*", { count: "exact", head: true });

  // If user is not admin, filter by their ID.
  if (user && user.role !== "ADMIN") {
    query = query.eq("user_id", user.id);
  }

  // Get RPM (Requests Per Minute)
  const { count: rpmCount } = await query.gte("created_at", oneMinuteAgo);

  // Get RPD (Requests Per Day)
  const { count: rpdCount } = await query.gte("created_at", twentyFourHoursAgo);

  // Gemini 1.5 Flash Free limits (from screenshot: 5 RPM, 20 RPD)
  const limit = 5;

  return {
    requestsLastMinute: rpmCount || 0,
    requestsLast24Hours: rpdCount || 0,
    limitRPM: limit,
    isRateLimited: (rpmCount || 0) >= limit,
  };
}

export type AiLogRecord = {
  id: number;
  created_at: string;
  model: string;
  feature: string;
  status: "success" | "error";
  error_message: string | null;
  user?: {
    full_name: string | null;
    email: string | null;
  };
};

export async function getAiLogs(limit: number = 20): Promise<AiLogRecord[]> {
  const user = await getCurrentProfile();
  if (!user) return [];

  const client =
    user.role === "ADMIN" ? createAdminClient() : await createClient();

  let query = client.from("ai_usage_logs").select(
    `
      id,
      created_at,
      model,
      feature,
      status,
      error_message,
      user:user_id (full_name, email)
    `,
  );

  if (user.role !== "ADMIN") {
    query = query.eq("user_id", user.id);
  }

  const { data } = await query
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data as any) || [];
}

export type AiDashboardStats = {
  totalRequests: number;
  successRate: number;
  chatbotUsage: number;
  blogUsage: number;
};

export async function getAiDashboardStats(): Promise<AiDashboardStats> {
  const user = await getCurrentProfile();

  if (!user) {
    return {
      totalRequests: 0,
      successRate: 0,
      chatbotUsage: 0,
      blogUsage: 0,
    };
  }

  const client =
    user.role === "ADMIN" ? createAdminClient() : await createClient();

  let query = client
    .from("ai_usage_logs")
    .select("feature, status")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (user.role !== "ADMIN") {
    query = query.eq("user_id", user.id);
  }

  const { data } = await query;

  if (!data || data.length === 0) {
    return {
      totalRequests: 0,
      successRate: 0,
      chatbotUsage: 0,
      blogUsage: 0,
    };
  }

  const total = data.length;
  const successCount = data.filter((d) => d.status === "success").length;
  const chatbotCount = data.filter((d) => d.feature === "chatbot").length;
  // All other features count as "Content/Tools" in the current UI logic
  const contentUsage = total - chatbotCount;

  return {
    totalRequests: total,
    successRate: Math.round((successCount / total) * 100),
    chatbotUsage: chatbotCount,
    blogUsage: contentUsage,
  };
}
