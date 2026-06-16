"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type AiLogInput = {
  model: string;
  feature: string;
  status: "success" | "error" | "validation_error";
  errorMessage?: string;
  promptTokens?: number;
  completionTokens?: number;
  userId?: string; // 👈 เพิ่มตรงนี้
};

export async function calculateAiCost(model: string, promptTokens: number, completionTokens: number) {
  const rates: Record<string, { input: number; output: number }> = {
    "gemini-1.5-flash": { input: 0.1, output: 0.4 },
    "gemini-1.5-pro": { input: 1.25, output: 5.0 },
    "gemini-flash-latest": { input: 0.1, output: 0.4 },
    "gemini-flash-lite-latest": { input: 0.05, output: 0.15 },
    "gemini-2.0-flash-exp": { input: 0.1, output: 0.4 },
  };

  const exchangeRate = 32; // 1 USD = 32 THB
  const modelKey = Object.keys(rates).find((k) => model.includes(k));
  const rate = modelKey ? rates[modelKey] : rates["gemini-1.5-flash"];

  const inputCostUsd = (promptTokens / 1_000_000) * rate.input;
  const outputCostUsd = (completionTokens / 1_000_000) * rate.output;
  return (inputCostUsd + outputCostUsd) * exchangeRate;
}

export async function logAiUsage(input: AiLogInput) {
  const supabase = await createClient();

  // 🕵️ Determine User ID: Priority to input, then session
  let finalUserId = input.userId;
  if (!finalUserId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      finalUserId = user?.id;
    } catch (e) {
      // Ignore if session read fails (e.g. non-request context)
    }
  }

  let costThb = 0;
  if (
    input.status === "success" &&
    input.promptTokens &&
    input.completionTokens
  ) {
    costThb = await calculateAiCost(input.model, input.promptTokens, input.completionTokens);
  }

  try {
    // Use admin client (service_role) to insert directly to avoid anonymous execution issues in background/Inngest tasks
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabaseAdmin = createAdminClient();

    // Fetch tenant ID
    const { data: tenant } = await supabaseAdmin.from("tenants_v3").select("id").limit(1).maybeSingle();
    const tenantId = tenant?.id || null;

    const { error } = await supabaseAdmin.from("ai_token_ledgers").insert({
      tenant_id: tenantId,
      user_id: finalUserId || null,
      feature: input.feature,
      model: input.model,
      prompt_tokens: input.promptTokens || 0,
      completion_tokens: input.completionTokens || 0,
      cost_thb: costThb,
    });

    if (error) {
      console.error("[logAiUsage] Direct Insert Error:", error);
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
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabaseAdmin = createAdminClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabaseAdmin
      .from("ai_token_ledgers")
      .delete()
      .lt("created_at", cutoffDate.toISOString());

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
    const supabase = await createClient();

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(
      now.getTime() - 24 * 60 * 60 * 1000,
    ).toISOString();

    const [rpmRes, rpdRes] = await Promise.all([
      supabase
        .from("ai_token_ledgers")
        .select("id", { count: "exact", head: true })
        .gte("created_at", oneMinuteAgo),
      supabase
        .from("ai_token_ledgers")
        .select("id", { count: "exact", head: true })
        .gte("created_at", twentyFourHoursAgo),
    ]);

    if (rpmRes.error)
      console.error("[getAiUsageStats] RPM Error:", rpmRes.error);
    if (rpdRes.error)
      console.error("[getAiUsageStats] RPD Error:", rpdRes.error);

    const limit = 4000;
    const rpmCount = rpmRes.count || 0;

    console.log(
      `[getAiUsageStats] now=${now.toISOString()}, 1minAgo=${oneMinuteAgo}, count=${rpmCount}`,
    );

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
      limitRPM: 4000,
      isRateLimited: false,
    };
  }
}

export type AiLogRecord = {
  id: number;
  created_at: string;
  model: string;
  feature: string;
  status: "success" | "error" | "validation_error";
  error_message: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  cost_thb: number;
  user?: {
    full_name: string | null;
    email: string | null;
  };
};

export async function getAiLogs(limit: number = 20): Promise<AiLogRecord[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Fetch role from profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = profile?.role;

    let query = supabase.from("ai_token_ledgers").select(`
      id,
      created_at,
      model,
      feature,
      prompt_tokens,
      completion_tokens,
      cost_thb,
      user_id
    `);

    if (role !== "ADMIN") {
      query = query.eq("user_id", user?.id);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[getAiLogs] DB Error:", error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Manual Join: Fetch unique profiles for these logs
    const userIds = Array.from(
      new Set(
        (data as { user_id: string | null }[])
          .map((d) => d.user_id)
          .filter((id): id is string => !!id),
      ),
    );
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds as string[]);

    if (profilesError) {
      console.error("[getAiLogs] Profiles Fetch Error:", profilesError);
    }

    const profileMap = new Map(
      (profiles as { id: string; full_name: string | null; email: string | null }[] | null)
        ?.map((p) => [p.id, p]) || []
    );

    return (data as any[]).map((d) => ({
      ...d,
      status: "success",
      error_message: null,
      user: d.user_id ? profileMap.get(d.user_id) : null,
    })) as unknown as AiLogRecord[];
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        totalRequests: 0,
        successRate: 0,
        chatbotUsage: 0,
        blogUsage: 0,
        totalCostThb: 0,
      };
    }

    // Fetch role from profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = profile?.role;

    let query = supabase
      .from("ai_token_ledgers")
      .select("feature, cost_thb");

    if (role !== "ADMIN") {
      query = query.eq("user_id", user?.id);
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
    const logs = data as { feature: string; cost_thb: number | string | null }[];
    const successCount = total;
    const chatbotCount = logs.filter((d) => d.feature === "chatbot" || d.feature === "content_refiner").length;
    const totalCost = logs.reduce(
      (sum: number, d) => sum + (Number(d.cost_thb) || 0),
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
