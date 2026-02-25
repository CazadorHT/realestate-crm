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
  promptTokens?: number;
  completionTokens?: number;
};

export async function logAiUsage(input: AiLogInput) {
  const adminClient = createAdminClient();
  const user = await getCurrentProfile();

  // Define Rates (in USD per 1M tokens)
  const rates: Record<
    string,
    { input: number; output: number; isManual?: boolean }
  > = {
    "gemini-1.5-flash": { input: 0.1, output: 0.4 },
    "gemini-1.5-pro": { input: 1.25, output: 5.0 },
    "gemini-flash-latest": { input: 0.1, output: 0.4 },
    "gemini-pro-latest": { input: 1.25, output: 5.0 },
    "gemini-2.0-flash-exp": { input: 0.1, output: 0.4 },
  };

  const exchangeRate = 32; // 1 USD = 32 THB

  let costThb = 0;
  if (
    input.status === "success" &&
    input.promptTokens &&
    input.completionTokens
  ) {
    const modelKey = Object.keys(rates).find((k) => input.model.includes(k));
    const rate = modelKey ? rates[modelKey] : rates["gemini-1.5-flash"];

    const inputCostUsd = (input.promptTokens / 1_000_000) * rate.input;
    const outputCostUsd = (input.completionTokens / 1_000_000) * rate.output;
    costThb = (inputCostUsd + outputCostUsd) * exchangeRate;
  }

  try {
    const { error } = await adminClient.from("ai_usage_logs").insert({
      model: input.model,
      feature: input.feature,
      status: input.status,
      error_message: input.errorMessage,
      user_id: user?.id || null,
      prompt_tokens: input.promptTokens || 0,
      completion_tokens: input.completionTokens || 0,
      cost_thb: costThb,
    });

    if (error) {
      console.error("[logAiUsage] Insert Error:", error);
    }

    if (Math.random() < 0.1) {
      pruneAiLogs(30).catch(console.error);
    }
  } catch (error) {
    console.error("[logAiUsage] Exception:", error);
  }
}

export async function pruneAiLogs(daysToKeep: number = 30) {
  try {
    const adminClient = createAdminClient();
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysToKeep);

    const { error } = await adminClient
      .from("ai_usage_logs")
      .delete()
      .lt("created_at", dateThreshold.toISOString());

    if (error) {
      console.error("[pruneAiLogs] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[pruneAiLogs] Exception:", error);
    return { success: false, error: "Internal server error during pruning" };
  }
}

export type AiUsageStats = {
  requestsLastMinute: number;
  requestsLast24Hours: number;
  limitRPM: number;
  isRateLimited: boolean;
};

export async function getAiUsageStats(): Promise<AiUsageStats> {
  try {
    const user = await getCurrentProfile();
    const client =
      user?.role === "ADMIN" ? createAdminClient() : await createClient();

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(
      now.getTime() - 24 * 60 * 60 * 1000,
    ).toISOString();

    const [rpmRes, rpdRes] = await Promise.all([
      client
        .from("ai_usage_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneMinuteAgo),
      client
        .from("ai_usage_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", twentyFourHoursAgo),
    ]);

    if (rpmRes.error)
      console.error("[getAiUsageStats] RPM Error:", rpmRes.error);
    if (rpdRes.error)
      console.error("[getAiUsageStats] RPD Error:", rpdRes.error);

    const limit = 5;
    const rpmCount = rpmRes.count || 0;

    return {
      requestsLastMinute: rpmCount,
      requestsLast24Hours: rpdRes.count || 0,
      limitRPM: limit,
      isRateLimited: rpmCount >= limit,
    };
  } catch (error) {
    console.error("[getAiUsageStats] Exception:", error);
    return {
      requestsLastMinute: 0,
      requestsLast24Hours: 0,
      limitRPM: 5,
      isRateLimited: false,
    };
  }
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
  try {
    const user = await getCurrentProfile();
    if (!user) return [];

    const client =
      user.role === "ADMIN" ? createAdminClient() : await createClient();

    let query = client.from("ai_usage_logs").select(`
      id,
      created_at,
      model,
      feature,
      status,
      error_message,
      user:user_id (full_name, email)
    `);

    if (user.role !== "ADMIN") {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[getAiLogs] Error:", error);
      return [];
    }

    return (data as any) || [];
  } catch (error) {
    console.error("[getAiLogs] Exception:", error);
    return [];
  }
}

export type AiDashboardStats = {
  totalRequests: number;
  successRate: number;
  chatbotUsage: number;
  blogUsage: number;
  totalCostThb: number;
};

export async function getAiDashboardStats(): Promise<AiDashboardStats> {
  try {
    const user = await getCurrentProfile();

    if (!user) {
      return {
        totalRequests: 0,
        successRate: 0,
        chatbotUsage: 0,
        blogUsage: 0,
        totalCostThb: 0,
      };
    }

    const client =
      user.role === "ADMIN" ? createAdminClient() : await createClient();

    let query = client
      .from("ai_usage_logs")
      .select("feature, status, cost_thb");

    if (user.role !== "ADMIN") {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[getAiDashboardStats] Error:", error);
      return {
        totalRequests: 0,
        successRate: 0,
        chatbotUsage: 0,
        blogUsage: 0,
        totalCostThb: 0,
      };
    }

    if (!data || data.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        chatbotUsage: 0,
        blogUsage: 0,
        totalCostThb: 0,
      };
    }

    const total = data.length;
    const successCount = data.filter((d) => d.status === "success").length;
    const chatbotCount = data.filter((d) => d.feature === "chatbot").length;
    const totalCost = data.reduce(
      (sum, d) => sum + (Number(d.cost_thb) || 0),
      0,
    );
    const contentUsage = total - chatbotCount;

    return {
      totalRequests: total,
      successRate: Math.round((successCount / total) * 100),
      chatbotUsage: chatbotCount,
      blogUsage: contentUsage,
      totalCostThb: totalCost,
    };
  } catch (error) {
    console.error("[getAiDashboardStats] Exception:", error);
    return {
      totalRequests: 0,
      successRate: 0,
      chatbotUsage: 0,
      blogUsage: 0,
      totalCostThb: 0,
    };
  }
}
