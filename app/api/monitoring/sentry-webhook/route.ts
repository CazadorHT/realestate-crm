import { NextRequest, NextResponse, after } from "next/server";
import { sendAdminNotification } from "@/lib/telegram";
import { logger } from "@/lib/logger";

/**
 * 🛡️ Super Sentry Webhook (Phase 3: Bulletproof & Zero Latency)
 * Optimized for speed and rich forensic data.
 */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  // 1. Security Check
  if (secret !== process.env.MONITORING_SECRET) {
    logger.warn("Unauthorized monitoring access attempt", {
      source: "monitoring-webhook",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // 2. Flexible Parsing (Support for different Sentry payload versions)
    const issue = body.data?.issue || body.issue || body;
    const event = body.data?.event || body.event || {};
    const tags = event.tags || issue.tags || [];

    const tagMap: Record<string, string> = {};
    if (Array.isArray(tags)) {
      tags.forEach((t: any) => {
        tagMap[t.key || t[0]] = t.value || t[1];
      });
    }

    const title = body.message || issue.title || "Unknown Error";
    const environment =
      event.environment ||
      tagMap["environment"] ||
      process.env.NODE_ENV ||
      "unknown";
    const level = issue.level || "error";
    const url = issue.permalink || body.url || "#";
    const sourceFile = event.culprit || issue.culprit || "Unknown Source";
    const affectedUser = event.user?.email || event.user?.id || "Anonymous";

    // 3. Expert Emoji & Priority Logic
    let icon = "⚠️";
    let priority = "NORMAL";

    if (
      title.toLowerCase().includes("finance") ||
      sourceFile.toLowerCase().includes("finance")
    ) {
      icon = "💸";
      priority = "CRITICAL";
    } else if (
      title.toLowerCase().includes("ai") ||
      title.toLowerCase().includes("gemini") ||
      sourceFile.toLowerCase().includes("inngest")
    ) {
      icon = "🤖";
      priority = "HIGH";
    } else if (level === "fatal" || level === "error") {
      icon = "🔴";
      priority = "URGENT";
    }

    // 4. Elite Message Formatting (Telegram HTML)
    const envIcon = environment === "production" ? "🌐" : "🧪";
    const telegramMessage = `
  ${icon} <b>Sentry Alert: ${priority}</b>
━━━━━━━━━━━━━━━━━━
💬 <b>Issue:</b> <code>${title}</code>
${envIcon} <b>Env:</b> <code>${environment.toUpperCase()}</code>

📍 <b>Source:</b>
<code>${sourceFile}</code>

👤 <b>Impacted:</b> <code>${affectedUser}</code>

🏷️ <b>Context:</b>
- Tenant: <code>${tagMap["tenant_id"] || "N/A"}</code>
- Property: <code>${tagMap["property_id"] || "N/A"}</code>

🔗 <a href="${url}">View Details on Sentry</a>
━━━━━━━━━━━━━━━━━━
<i>Sent via VC Connect Command Center</i>
    `.trim();

    // 5. Zero Latency Dispatch: Use after() to ensure delivery in Serverless environments
    after(async () => {
      try {
        await sendAdminNotification(telegramMessage, { parseMode: "HTML" });
      } catch (err) {
        logger.error("Failed to dispatch telegram alert", err, {
          source: "monitoring-webhook",
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Sentry Webhook Payload Error", error, {
      source: "monitoring-webhook",
    });
    return NextResponse.json({ error: "Payload Error" }, { status: 400 });
  }
}
