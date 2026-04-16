"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Json } from "@/lib/database.types";
import { sendLineNotification } from "@/lib/line";
import { getTemplateConfig } from "@/features/line/utils";
import { headers } from "next/headers";

import { parseUserAgent } from "./utils";

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

    // Prepare metadata with system info
    const enrichedMetadata = {
      ...(typeof metadata === "object" ? metadata : {}),
      ip,
      userAgent: parseUserAgent(userAgent),
    };

    // [SECURITY] Allow anonymous logging ONLY for login failures or specific public actions
    if (!user && action !== "LOGIN_FAILURE") return;

    const adminClient = createAdminClient();
    await adminClient.from("audit_logs").insert({
      user_id: user?.id || null, // No longer needs 'as any' since types are regenerated
      action,
      entity,
      entity_id: entityId || null,
      metadata: enrichedMetadata as Json,
    });

    if (action === "LOGIN") {
      const email =
        metadata && typeof metadata === "object" && "email" in metadata
          ? (metadata as Record<string, any>).email
          : user?.email || "anonymous";

      // Fetch Profile for Role and Avatar (Only if user exists)
      const { data: profile } = user ? await adminClient
        .from("profiles")
        .select("role, avatar_url")
        .eq("id", user.id)
        .single() : { data: null };

      const templateConfig = await getTemplateConfig("LOGIN");
      const headerIcon = "🔐";

      const flexContents: any = {
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
    }
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export async function notifySignupAction(email: string) {
  console.log("[NOTIFY] Starting notifySignupAction for:", email);
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
  } catch (error) {
    console.error("[NOTIFY] Error in notifySignupAction:", error);
  }
}
import { requireAuthContext } from "@/lib/authz";
import { AuditActionResult, AuditLogEntry } from "./types";

export async function getPropertyAuditLogsAction(
  propertyId: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<AuditActionResult<{ logs: AuditLogEntry[]; totalCount: number; hasMore: boolean }>> {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("audit_logs")
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          avatar_url,
          role
        )
      `, { count: "exact" })
      .eq("entity_id", propertyId)
      .eq("entity", "properties");

    // 🛡️ [BRANCH ISOLATION] Apply tenant filter if not in "ALL" mode
    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    return {
      success: true,
      data: {
        logs: (data as unknown) as AuditLogEntry[],
        totalCount: count || 0,
        hasMore: (count || 0) > offset + pageSize,
      }
    };
  } catch (error: any) {
    console.error("Failed to fetch audit logs:", error);
    return { 
      success: false, 
      message: error.message || "ไม่สามารถโหลดประวัติข้อมูลได้",
      errorType: "SYSTEM_ERROR"
    };
  }
}
