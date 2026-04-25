"use server";

import { createClient } from "@/lib/supabase/server";
import { Json } from "@/lib/database.types";
import { sendLineNotification } from "@/lib/line";
import { getTemplateConfig } from "@/features/line/utils";
import { headers } from "next/headers";

import { parseUserAgent } from "./utils";
import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

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

    // 🌐 Capture IP and User Agent from headers
    const reqHeaders = await headers();
    const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0] || reqHeaders.get("x-real-ip") || "unknown";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    const email =
      metadata && typeof metadata === "object" && "email" in metadata
        ? (metadata as Record<string, unknown>).email
        : user?.email || "anonymous";

    // Prepare metadata with system info
    const enrichedMetadata = {
      ...(typeof metadata === "object" ? metadata : {}),
      ip,
      userAgent: parseUserAgent(userAgent),
    };

    // 🛡️ [PHASE 1] Use Security Definer RPC for logging to avoid adminClient bypass
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

    // 🕵️ Resolve User Identity for Notifications (Use secure RPC to avoid adminClient)
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
      // Authenticated user can read their own profile usually
      const { data: p } = await supabase
        .from("profiles")
        .select("id, role, avatar_url")
        .eq("id", user.id)
        .single();
      profile = p as ProfileSummary;
    }

    // 🛡️ Sentry Integration: Add breadcrumb for every important action
    Sentry.addBreadcrumb({
      category: "activity",
      message: `${action} ${entity}`,
      level: "info",
      data: { entityId, userId: effectiveUserId },
    });

    // 🛡️ Structured Logging: Info level for traceability
    logger.info(`Activity: ${action} ${entity}`, {
      source: "audit-actions",
      action,
      entity,
      entityId,
      userId: effectiveUserId,
    });

    if (action === "LOGIN") {
      console.log(`[AUDIT] Detected LOGIN action for: ${email}`);
      
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
                  text: parseUserAgent(
                    (await (await headers()).get("user-agent")) || "",
                  ),
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

      // Add Avatar as Hero if exists
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

      // 🛡️ S-Tier Telegram Security Alert (Hybrid Model)
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

      // 🔐 Enterprise Telegram Notification (Admin Hub)
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
    }
  } catch (error) {
    logger.error("logActivityAction critical failure", error, { source: "audit-actions" });
  }
}

export async function notifySignupAction(email: string) {
  try {
    const templateConfig = await getTemplateConfig("SIGNUP");
    const headerIcon = "👤";

    await sendLineNotification({
      type: "flex",
      altText: "👤 มีสมาชิกใหม่สมัครใช้งาน",
      contents: {
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
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "📧 อีเมล:",
              size: "sm",
              color: "#555555",
            },
            {
              type: "text",
              text: email,
              weight: "bold",
              size: "lg",
              color: "#111111",
              margin: "sm",
              wrap: true,
            },
          ],
        },
      },
    });
    console.log("[NOTIFY] notifySignupAction completed for:", email);

    // 🛡️ S-Tier Telegram Notification (Admin Hub)
    try {
      const { sendAdminNotification } = await import("@/lib/telegram");
      await sendAdminNotification(
        `👤 <b>แจ้งเตือนสมาชิกใหม่ (New Signup)</b>\n━━━━━━━━━━━━━━━━━━\n\n<b>📧 อีเมล:</b> <code>${email}</code>\n<b>⏰ เวลา:</b> ${new Date().toLocaleString("th-TH")}\n\n<i>กรุณาตรวจสอบและกำหนดบทบาท (Role) ในระบบหลังบ้านครับ</i>`
      );
    } catch (tgErr) {
      console.error("[NOTIFY] Telegram Notification failed for Signup:", tgErr);
    }
  } catch (error) {
    console.error("[NOTIFY] Error in notifySignupAction:", error);
  }
}
import { requireAuthContext } from "@/lib/authz";
import { AuditActionResult, AuditLogEntry } from "./types";

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

    // 🛡️ [HARDENING] Fetch audit logs without direct join to avoid schema cache issues with partitioned tables
    let query = supabase
      .from("audit_logs")
      .select("id, user_id, action, entity, entity_id, metadata, tenant_id, created_at", { count: "exact" })
      .eq("entity_id", propertyId)
      .eq("entity", "properties");

    // 🛡️ [BRANCH ISOLATION] Apply tenant filter if not in "ALL" mode
    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    // 🛡️ [FILTERS] Apply Action and User filters
    if (filters.action && filters.action !== "ALL") {
      query = query.eq("action", filters.action);
    }
    if (filters.userId && filters.userId !== "ALL") {
      query = query.eq("user_id", filters.userId);
    }

    // 🛡️ [SEARCH] Client-side search logic moved to server for performance
    if (filters.search) {
      // Search in actions or metadata summary (diff)
      // Note: Full-text search on JSONB might be slow, but for single property id is acceptable
      query = query.or(`action.ilike.%${filters.search}%,metadata->>diff.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    // 🛡️ [MANUAL JOIN] Fetch profiles for the found user_ids
    const userIds = Array.from(new Set(data?.map((log) => log.user_id).filter(Boolean))) as string[];
    
    const { data: profiles } = userIds.length > 0 
      ? await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, role")
          .in("id", userIds)
      : { data: [] };

    const profileMap = new Map(profiles?.map((p) => [p.id, p]));

    // 🛡️ [SECURITY] Deep Scrub sensitive metadata & Map profiles
    const enrichedData = (data || []).map((log) => {
      const logWithUser = {
        ...log,
        user: log.user_id ? (profileMap.get(log.user_id) || null) : null
      };

      if (role === "ADMIN") return logWithUser;
      
      return {
        ...logWithUser,
        metadata: scrubMetadata(log.metadata)
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
 * 📊 Sentinel Summary: Fetch total counts for actions and modifiers 
 * for a specific property to populate filter UI badges accurately.
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
      .from("audit_logs")
      .select("action, user_id", { count: "exact" })
      .eq("entity_id", propertyId)
      .eq("entity", "properties");

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const actionCounts: Record<string, number> = {};
    const modifierCounts: Record<string, number> = {};

    data?.forEach((log) => {
      // Action stats
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      
      // Modifier (User) stats
      if (log.user_id) {
        modifierCounts[log.user_id] = (modifierCounts[log.user_id] || 0) + 1;
      }
    });

    // 🛡️ Fetch profiles for all involved modifiers to ensure filter UI has names
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
