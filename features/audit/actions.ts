"use server";

import { createClient } from "@/lib/supabase/server";
import { Json } from "@/lib/database.types.generated";
import { sendLineNotification } from "@/lib/line";
import { getTemplateConfig } from "@/features/line/utils";
import { headers } from "next/headers";
import { requireAuthContext } from "@/lib/authz";
import { AuditActionResult, AuditLogEntry } from "./types";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";
import { parseUserAgent } from "./utils";
import { notifyAdminsAction } from "@/lib/actions/notifications";

/**
 * 🛡️ PDPA Helper: Scrub sensitive keys from object recursively
 */
const SENSITIVE_LOG_KEYS = [
  "commission_sale_percentage",
  "commission_rent_months",
  "co_agent_phone",
  "co_agent_contact_id",
  "co_agent_contact_channel",
  "co_agent_sale_commission_percent",
  "co_agent_rent_commission_months",
  "owner_name",
  "owner_phone",
  "owner_line",
  "owner_email"
];

function scrubMetadata(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  
  if (Array.isArray(obj)) {
    return obj.map((x: unknown) => scrubMetadata(x));
  }

  const scrubbed: Record<string, unknown> = {};
  const entries = Object.entries(obj as Record<string, unknown>);
  
  for (const [key, value] of entries) {
    const isSensitive = SENSITIVE_LOG_KEYS.some(
      (k) => key.toLowerCase() === k.toLowerCase()
    );

    if (isSensitive) {
      scrubbed[key] = "[MASKED]";
    } else if (value !== null && typeof value === "object") {
      scrubbed[key] = scrubMetadata(value);
    } else {
      scrubbed[key] = value;
    }
  }
  return scrubbed;
}

/**
 * 📝 Log Activity Action
 * Handles system-wide audit logging and notifications
 */
export async function logActivityAction(
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Json,
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const reqHeaders = await headers();
    const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0] || reqHeaders.get("x-real-ip") || "unknown";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    const email =
      metadata && typeof metadata === "object" && "email" in metadata
        ? (metadata as Record<string, unknown>).email
        : user?.email || "anonymous";

    const enrichedMetadata = {
      ...(typeof metadata === "object" ? metadata : {}),
      ip,
      userAgent: parseUserAgent(userAgent),
    };

    const { error: dbError } = await supabase.rpc("log_system_activity", {
      p_action: action,
      p_entity: entity,
      p_entity_id: entityId || null,
      p_metadata: enrichedMetadata as Json,
      p_email: action === "LOGIN" || action === "LOGIN_FAILURE" ? email : null
    });

    if (dbError) {
      logger.error("Audit log RPC failed", dbError, { source: "audit-actions", action, entity });
    }

    type ProfileSummary = {
      id: string;
      role: string;
      avatar_url: string | null;
    };
    let profile: ProfileSummary | null = null;
    let effectiveUserId = user?.id;

    if (action === "LOGIN" || action === "LOGIN_FAILURE") {
      const { data: p } = await supabase.rpc("get_profile_by_email", {
        p_email: email
      });
      
      if (p) {
        profile = p as ProfileSummary;
        effectiveUserId = profile.id;
      }
    } else if (user) {
      const { data: p } = await supabase
        .from("profiles")
        .select("id, role, avatar_url")
        .eq("id", user.id)
        .single();
      profile = p as ProfileSummary;
    }

    Sentry.addBreadcrumb({
      category: "activity",
      message: `${action} ${entity}`,
      level: "info",
      data: { entityId, userId: effectiveUserId },
    });

    logger.info(`Activity: ${action} ${entity}`, {
      source: "audit-actions",
      action,
      entity,
      entityId,
      userId: effectiveUserId,
    });

    if (action === "LOGIN") {
      const templateConfig = await getTemplateConfig("LOGIN");
      const headerIcon = "🔐";

      const flexContents: Record<string, unknown> = {
        type: "bubble",
        header: {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: headerIcon,
              size: "xxl",
              flex: 1,
              align: "center",
              gravity: "center",
            },
            {
              type: "text",
              text: templateConfig.config.headerText || "เข้าสู่ระบบ (Login)",
              weight: "bold",
              color: "#FFFFFF",
              size: "md",
              flex: 8,
              gravity: "center",
              wrap: true,
            },
          ],
          backgroundColor: templateConfig.config.headerColor || "#1E88E5",
          paddingAll: "lg",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "📧 อีเมล:",
                  size: "sm",
                  color: "#555555",
                  flex: 3,
                },
                {
                  type: "text",
                  text: String(email),
                  size: "sm",
                  weight: "bold",
                  color: "#111111",
                  flex: 7,
                  wrap: true,
                },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              margin: "md",
              contents: [
                {
                  type: "text",
                  text: "👤 สิทธิ์:",
                  size: "sm",
                  color: "#555555",
                  flex: 3,
                },
                {
                  type: "text",
                  text: profile?.role || "USER",
                  size: "sm",
                  weight: "bold",
                  color: "#1E88E5",
                  flex: 7,
                },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              margin: "md",
              contents: [
                {
                  type: "text",
                  text: "📱 อุปกรณ์:",
                  size: "sm",
                  color: "#555555",
                  flex: 3,
                },
                {
                  type: "text",
                  text: parseUserAgent(userAgent),
                  size: "sm",
                  color: "#111111",
                  flex: 7,
                  wrap: true,
                },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              margin: "md",
              contents: [
                {
                  type: "text",
                  text: "⏰ เวลา:",
                  size: "sm",
                  color: "#555555",
                  flex: 3,
                },
                {
                  type: "text",
                  text: new Date().toLocaleString("th-TH", {
                    timeZone: "Asia/Bangkok",
                    dateStyle: "medium",
                    timeStyle: "short",
                  }),
                  size: "sm",
                  color: "#111111",
                  flex: 7,
                },
              ],
            },
          ],
          paddingAll: "lg",
        },
      };

      if (profile?.avatar_url) {
        flexContents.hero = {
          type: "image",
          url: profile.avatar_url,
          size: "full",
          aspectRatio: "1:1",
          aspectMode: "cover",
        };
      }

      await sendLineNotification({
        type: "flex",
        altText: "🔓 มีผู้ใช้งานเข้าสู่ระบบ",
        contents: flexContents,
      });

      try {
        const { inngest } = await import("@/lib/inngest/client");
        await inngest.send({
          name: "auth.login",
          data: {
            userId: effectiveUserId,
            email: email,
            role: profile?.role || "USER",
            metadata: enrichedMetadata
          }
        });
      } catch (inngestErr) {
        logger.error("[AUDIT] Inngest event send failed:", inngestErr);
      }

      try {
        const { sendAdminNotification } = await import("@/lib/telegram");
        const time = new Date().toLocaleString("th-TH", {
          timeZone: "Asia/Bangkok",
          dateStyle: "medium",
          timeStyle: "short",
        });

        const message = `
🔐 <b>แจ้งเตือนการเข้าสู่ระบบ (Login Alert)</b>
━━━━━━━━━━━━━━━━━━
<b>📧 ผู้ใช้งาน:</b> <code>${email}</code>
<b>👤 บทบาท:</b> <code>${profile?.role || "USER"}</code>
<b>📱 อุปกรณ์:</b> <code>${parseUserAgent(userAgent)}</code>
<b>🌐 พิกัด:</b> <code>${enrichedMetadata.ip}</code>

<b>⏰ เวลา:</b> ${time}
━━━━━━━━━━━━━━━━━━
<i>ระบบรักษาความปลอดภัย VC Connect</i>
        `.trim();

        await sendAdminNotification(message);
      } catch (tgErr) {
        logger.error("[AUDIT] Telegram Notification failed:", tgErr);
      }

      // 🔔 New: Add In-app notification for Login
      await notifyAdminsAction({
        type: "INFO",
        title: "มีการเข้าสู่ระบบ 🔑",
        message: `ผู้ใช้ ${email} (${profile?.role || "USER"}) เข้าสู่ระบบแล้ว`,
        link: "/protected/settings/users",
      });
    }
  } catch (error) {
    logger.error("logActivityAction critical failure", error, { source: "audit-actions" });
  }
}

/**
 * 🔔 Notify Signup Action
 * Sends notifications to admins via LINE and Telegram for new signups
 * Includes secure one-click approval links.
 */
export async function notifySignupAction(
  email: string, 
  userId?: string, 
  metadata?: { full_name?: string; avatar_url?: string }
) {
  try {
    const templateConfig = await getTemplateConfig("SIGNUP");
    const headerIcon = "👤";
    const fullName = metadata?.full_name || "Unknown User";
    const avatarUrl = metadata?.avatar_url;

    let approvalUrl = "";
    if (userId) {
      const { siteConfig } = await import("@/lib/site-config");
      const crypto = await import("crypto");
      const role = "AGENT";
      const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback_secret";
      const token = crypto
        .createHmac("sha256", secret)
        .update(`${userId}:${role}`)
        .digest("hex");
      
      approvalUrl = `${siteConfig.url}/api/admin/approve-user?userId=${userId}&role=${role}&token=${token}`;
    }

    const footerContents: any[] = [];
    if (approvalUrl) {
      footerContents.push({
        type: "button",
        action: {
          type: "uri",
          label: "✅ อนุมัติเป็น AGENT",
          uri: approvalUrl
        },
        style: "primary",
        color: "#F57C00",
        height: "sm"
      });
    }

    await sendLineNotification({
      type: "flex",
      altText: "👤 มีสมาชิกใหม่สมัครใช้งาน",
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "horizontal",
          contents: [
            { type: "text", text: headerIcon, size: "xxl", flex: 1, align: "center", gravity: "center" },
            {
              type: "text",
              text: templateConfig.config.headerText || "สมาชิกใหม่ (New User)",
              weight: "bold",
              color: "#FFFFFF",
              size: "md",
              flex: 8,
              gravity: "center",
              wrap: true,
            },
          ],
          backgroundColor: templateConfig.config.headerColor || "#F57C00",
          paddingAll: "lg",
        },
        hero: avatarUrl ? {
          type: "image",
          url: avatarUrl,
          size: "full",
          aspectRatio: "20:13",
          aspectMode: "cover",
        } : undefined,
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: "👤 ชื่อ:", size: "xs", color: "#555555" },
            { type: "text", text: fullName, weight: "bold", size: "md", color: "#111111", margin: "xs", wrap: true },
            { type: "text", text: "📧 อีเมล:", size: "xs", color: "#555555", margin: "md" },
            { type: "text", text: email, weight: "bold", size: "md", color: "#111111", margin: "xs", wrap: true },
          ],
        },
        footer: footerContents.length > 0 ? {
          type: "box",
          layout: "vertical",
          contents: footerContents,
          paddingAll: "md"
        } : undefined
      },
    });

    try {
      const { sendAdminNotification, sendAdminPhoto } = await import("@/lib/telegram");
      let message = `👤 <b>แจ้งเตือนสมาชิกใหม่ (New Signup)</b>\n━━━━━━━━━━━━━━━━━━\n\n<b>👤 ชื่อ:</b> <code>${fullName}</code>\n<b>📧 อีเมล:</b> <code>${email}</code>\n<b>⏰ เวลา:</b> ${new Date().toLocaleString("th-TH")}\n\n<i>💬 ตอบกลับข้อความนี้ด้วยคำว่า <b>"agent"</b> หรือ <b>"อนุมัติ"</b> เพื่อปรับบทบาททันทีครับ</i>`;
      
      if (userId) {
        message += `\n\n<span class="tg-spoiler">ID: ${userId}</span>`; 
      }

      if (avatarUrl) {
        await sendAdminPhoto(avatarUrl, message);
      } else {
        await sendAdminNotification(message);
      }
    } catch (tgErr) {
      console.error("[NOTIFY] Telegram Notification failed for Signup:", tgErr);
    }

    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const supabaseAdmin = createAdminClient("internal");
      const { error: rpcError } = await supabaseAdmin.rpc("notify_admins_of_signup" as any, {
        p_email: email,
      });

      if (rpcError) {
        console.error("[NOTIFY] RPC Notification error:", rpcError);
      }
    } catch (notifErr) {
      console.error("[NOTIFY] In-app Notification failed for Signup:", notifErr);
    }

    // 🔔 New: Add In-app notification for Signup with Approval Hint
    await notifyAdminsAction({
      type: "SYSTEM",
      title: "มีผู้สมัครสมาชิกใหม่ 🆕",
      message: `มีผู้ใช้ใหม่สมัครสมาชิกด้วยอีเมล ${email} (รอการอนุมัติสิทธิ์ Agent 🛡️)`,
      link: "/protected/settings/users",
    });
  } catch (error) {
    console.error("[NOTIFY] Error in notifySignupAction:", error);
  }
}

/**
 * 🔍 Get Property Audit Logs (V3 Hardened)
 */
export async function getPropertyAuditLogsAction(
  propertyId: string,
  page: number = 1,
  pageSize: number = 10,
  filters: {
    action?: string;
    userId?: string;
    search?: string;
  } = {}
): Promise<AuditActionResult<{ logs: AuditLogEntry[]; totalCount: number; hasMore: boolean }>> {
  try {
    const { supabase, tenantId, role } = await requireAuthContext();
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("system_audit_logs_v3")
      .select("id, actor_id, action, entity_table, entity_id, new_data, tenant_id, created_at", { count: "exact" })
      .eq("entity_id", propertyId)
      .in("entity_table", ["properties", "properties_core"]);

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    if (filters.action && filters.action !== "ALL") {
      query = query.eq("action", filters.action);
    }
    if (filters.userId && filters.userId !== "ALL") {
      query = query.eq("actor_id", filters.userId);
    }

    if (filters.search) {
      query = query.or(`action.ilike.%${filters.search}%,new_data->>diff.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    const userIds = Array.from(new Set(data?.map((log) => log.actor_id).filter(Boolean))) as string[];
    
    const { data: profiles } = userIds.length > 0 
      ? await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, role")
          .in("id", userIds)
      : { data: [] };

    const profileMap = new Map(profiles?.map((p) => [p.id, p]));

    const enrichedData = (data || []).map((log) => {
      const matchedProfile = log.actor_id ? (profileMap.get(log.actor_id) || null) : null;
      const logWithUser = {
        id: log.id,
        created_at: log.created_at,
        user_id: log.actor_id,
        action: log.action,
        entity: log.entity_table,
        entity_id: log.entity_id || "",
        tenant_id: log.tenant_id || "",
        metadata: (log.new_data || {}) as any,
        user: matchedProfile,
        profiles: matchedProfile
      };

      if (role === "ADMIN") return logWithUser;
      
      return {
        ...logWithUser,
        metadata: scrubMetadata(logWithUser.metadata)
      };
    });

    return {
      success: true,
      data: {
        logs: enrichedData as AuditLogEntry[],
        totalCount: count || 0,
        hasMore: (count || 0) > offset + pageSize,
      }
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Failed to fetch audit logs:", err);
    return { 
      success: false, 
      message: err.message || "ไม่สามารถโหลดประวัติข้อมูลได้",
      errorType: "SYSTEM_ERROR"
    };
  }
}

/**
 * 📊 Get Audit Stats Action (V3 Hardened)
 */
export async function getAuditStatsAction(
  propertyId: string
): Promise<AuditActionResult<{ 
  totalCount: number;
  actionCounts: Record<string, number>;
  modifierCounts: Record<string, number>;
  modifierProfiles: Record<string, { name: string; avatar?: string }>;
}>> {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    let query = supabase
      .from("system_audit_logs_v3")
      .select("action, actor_id", { count: "exact" })
      .eq("entity_id", propertyId)
      .in("entity_table", ["properties", "properties_core"]);

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const actionCounts: Record<string, number> = {};
    const modifierCounts: Record<string, number> = {};

    data?.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      if (log.actor_id) {
        modifierCounts[log.actor_id] = (modifierCounts[log.actor_id] || 0) + 1;
      }
    });

    const userIds = Object.keys(modifierCounts);
    const { data: profiles } = userIds.length > 0 
      ? await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds)
      : { data: [] };

    const modifierProfiles: Record<string, { name: string; avatar?: string }> = {};
    profiles?.forEach((p) => {
      modifierProfiles[p.id] = {
        name: p.full_name || "Unknown Agent",
        avatar: p.avatar_url || undefined
      };
    });

    return {
      success: true,
      data: {
        totalCount: count || 0,
        actionCounts,
        modifierCounts,
        modifierProfiles,
      }
    };
  } catch (error) {
    console.error("Failed to fetch audit stats:", error);
    return { success: false, message: "ไม่สามารถโหลดข้อมูลสรุปประวัติได้" };
  }
}
