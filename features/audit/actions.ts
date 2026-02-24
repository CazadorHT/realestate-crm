"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Json } from "@/lib/database.types";
import { sendLineNotification } from "@/lib/line";
import { getTemplateConfig } from "@/features/line/utils";
import { headers } from "next/headers";

// Helper to parse User-Agent into a friendly string
function parseUserAgent(ua: string) {
  if (!ua) return "Unknown Device";
  const browser =
    /chrome|firefox|safari|edge|msie|trident/i.exec(ua)?.[0] || "Browser";
  const os =
    /windows|macintosh|iphone|ipad|android|linux/i.exec(ua)?.[0] || "OS";

  // Cleanup
  const cleanBrowser =
    browser.charAt(0).toUpperCase() + browser.slice(1).toLowerCase();
  const cleanOS = os.charAt(0).toUpperCase() + os.slice(1).toLowerCase();

  return `${cleanBrowser} on ${cleanOS}`;
}

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

    if (!user) return; // Only log for authenticated users

    const adminClient = createAdminClient();
    await adminClient.from("audit_logs").insert({
      user_id: user.id,
      action,
      entity,
      entity_id: entityId || null,
      metadata: (metadata || {}) as Json,
    });

    if (action === "LOGIN") {
      const email =
        metadata && typeof metadata === "object" && "email" in metadata
          ? metadata.email
          : user.email;

      // Fetch Profile for Role and Avatar
      const { data: profile } = await adminClient
        .from("profiles")
        .select("role, avatar_url")
        .eq("id", user.id)
        .single();

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
