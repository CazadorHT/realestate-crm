import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateRentNotificationFlex, getLocaleDateFormat, getPropertyDisplayInfo } from "@/features/rent-notifications/utils";

// PERFORMANCE CONFIG
const BATCH_SIZE = 5; // Send N messages in parallel
const MAX_RUNTIME_MS = 25000; // 25s threshold to exit before Vercel timeout (30s)

export async function GET(req: NextRequest) {
  const startTime = performance.now();
  
  // 1. Verify Secret (Supports both ?secret= query and Vercel Authorization header)
  const secret = req.nextUrl.searchParams.get("secret");
  const authHeader = req.headers.get("Authorization");
  const expectedSecret = process.env.CRON_SECRET;

  const isValid = 
    !expectedSecret || 
    secret === expectedSecret || 
    authHeader === `Bearer ${expectedSecret}`;

  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const today = new Date();
    const currentDay = today.getDate();
    const currentHour = today.getHours();
    const todayStr = today.toISOString().split("T")[0];

    // Check if today is the last day of the month
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isLastDayOfMonth = tomorrow.getDate() === 1;

    // 2. FETCH WORK: Scheduled rules OR Rules that failed today (Auto-Retry)
    // We fetch EVERYTHING for this hour and day first
    let query = supabase
      .from("rent_notification_rules")
      .select(`
        *,
        properties (*, property_images (*)),
        line_groups (group_id, group_name),
        rent_notification_history (status, created_at, retry_count)
      `)
      .eq("is_active", true)
      .eq("notification_hour", currentHour);

    if (isLastDayOfMonth) {
      query = query.gte("notification_day", currentDay);
    } else {
      query = query.eq("notification_day", currentDay);
    }

    const { data: rules, error } = await query;
    if (error) throw error;
    if (!rules || rules.length === 0) {
      return NextResponse.json({ message: "No work found for this slot." });
    }

    // 3. FILTER rules: Must not have a SUCCESS today
    // AND must either have no attempt OR (ERROR attempt AND retry_count < 3)
    const pendingRules = rules.filter(rule => {
      const todayHistory = rule.rent_notification_history?.filter((h: any) => 
        h.created_at.startsWith(todayStr)
      );
      
      const hasSuccess = todayHistory?.some((h: any) => h.status === "SUCCESS");
      if (hasSuccess) return false;

      const latestError = todayHistory
        ?.filter((h: any) => h.status === "ERROR")
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      if (!latestError) return true; // Never attempted today
      return (latestError.retry_count || 0) < 3; // Attempted but failed and under limit
    });

    if (pendingRules.length === 0) {
      return NextResponse.json({ message: "No pending or retryable tasks found." });
    }

    const results = [];
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) throw new Error("Missing LINE Token");

    // 4. CONCURRENT PROCESSING IN CHUNKS
    for (let i = 0; i < pendingRules.length; i += BATCH_SIZE) {
      // Check for Timeout
      if (performance.now() - startTime > MAX_RUNTIME_MS) {
        console.warn(`[Cron] Exiting early due to runtime constraints. Remaining: ${pendingRules.length - i}`);
        break;
      }

      const chunk = pendingRules.slice(i, i + BATCH_SIZE);
      
      const chunkPromises = chunk.map(async (rule) => {
        try {
          // Precise Contract Check
          const { data: activeContract } = await supabase
            .from("rental_contracts")
            .select("*, deal:deals!inner(property_id)")
            .eq("deal.property_id", rule.property_id)
            .eq("status", "ACTIVE")
            .gte("end_date", todayStr)
            .maybeSingle();

          if (!activeContract) return { ruleId: rule.id, status: "skipped_no_active_contract" };

          // Prepare Message
          const { propertyName, price, coverImageUrl, bedrooms, bathrooms, sizeSqm } = getPropertyDisplayInfo(rule);
          const lang = (rule.language as "th" | "en" | "cn") || "th";
          const dateFormat = getLocaleDateFormat(lang);
          
          const message = generateRentNotificationFlex({
            propertyName, price, coverImageUrl, bedrooms, bathrooms, sizeSqm,
            monthYear: today.toLocaleDateString(dateFormat, { month: "long", year: "numeric" }),
            contractEndDate: activeContract.end_date ? new Date(activeContract.end_date).toLocaleDateString(dateFormat, { day: "numeric", month: "short", year: "numeric" }) : "-",
            language: lang,
            isTest: false,
          });

          // Push to LINE
          const response = await fetch("https://api.line.me/v2/bot/message/push", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ to: rule.line_group_id, messages: [message] }),
          });

          if (!response.ok) {
             const errText = await response.text();
             throw new Error(`LINE API: ${response.status} - ${errText}`);
          }

          // Log Success
          await supabase.from("rent_notification_history").insert({
            rule_id: rule.id,
            tenant_id: rule.tenant_id,
            property_id: rule.property_id,
            line_group_id: rule.line_group_id,
            status: "SUCCESS"
          });

          await supabase.from("rent_notification_rules").update({ last_sent_at: new Date().toISOString() }).eq("id", rule.id);
          return { ruleId: rule.id, status: "sent" };

        } catch (err: any) {
          console.error(`[Cron] Rule ${rule.id} failed:`, err.message);
          
          // Increment retry_count from latest attempt
          const todayHistory = rule.rent_notification_history?.filter((h: any) => h.created_at.startsWith(todayStr));
          const latestCount = todayHistory?.reduce((max: number, h: any) => Math.max(max, h.retry_count || 0), 0) || 0;

          await supabase.from("rent_notification_history").insert({
            rule_id: rule.id,
            tenant_id: rule.tenant_id,
            property_id: rule.property_id,
            line_group_id: rule.line_group_id,
            status: "ERROR",
            error_message: err.message,
            retry_count: latestCount + 1
          });

          return { ruleId: rule.id, status: "error", error: err.message };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    const duration = performance.now() - startTime;
    return NextResponse.json({
      success: true,
      processed: results.length,
      duration_ms: Math.round(duration),
      summary: {
        sent: results.filter(r => r.status === "sent").length,
        error: results.filter(r => r.status === "error").length,
        skipped: results.filter(r => r.status.startsWith("skipped")).length
      },
      details: results
    });

  } catch (error: any) {
    console.error("Cron Job Execution Failure:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
