import { createAdminClient } from "@/lib/supabase/admin";
import { Database } from "@/lib/database.types";
import { Json } from "@/lib/database.types.generated";
import { getSiteSettings } from "@/features/site-settings/actions";

const LINE_MESSAGING_API = "https://api.line.me/v2/bot/message/push";

export async function sendLineNotification(
  message: string | Record<string, any>,
) {
  let token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  let userId = process.env.LINE_ADMIN_USER_ID;

  // Independent lazy fallbacks: only query site settings if token or userId is missing
  if (!token || !userId) {
    try {
      const settings = await getSiteSettings();
      if (!token && settings?.line_channel_access_token) {
        token = settings.line_channel_access_token;
      }
      if (!userId && (settings as any)?.line_admin_user_id) {
        userId = (settings as any).line_admin_user_id;
      }
    } catch (e) {
      console.warn("Failed to fetch site settings for line notifications:", e);
    }
  }

  if (!token) {
    console.error("ไม่พบ LINE_CHANNEL_ACCESS_TOKEN หรือ line_channel_channel_access_token ในการตั้งค่า");
    return;
  }

  // ถ้าไม่มี ID ใน ENV หรือ Site Settings ให้ดึงจากโปรไฟล์แอดมิน (ห่อด้วย unstable_cache 30 วัน กันยิง DB ซ้ำ)
  if (!userId) {
    try {
      const { unstable_cache } = await import("next/cache");
      userId = await unstable_cache(
        async () => {
          const supabase = createAdminClient();
          
          // 1. พยายามหาแอดมินที่มี line_user_id (ID จริงของ LINE)
          const { data: adminUser } = await supabase
            .from("profiles")
            .select("line_user_id, line_id")
            .eq("role", "ADMIN")
            .not("line_user_id", "is", null)
            .neq("line_user_id", "")
            .limit(1)
            .maybeSingle();

          if (adminUser?.line_user_id) {
            return adminUser.line_user_id;
          } else if (adminUser?.line_id && adminUser.line_id.startsWith("U") && adminUser.line_id.length === 33) {
            return adminUser.line_id;
          }

          // 2. แผนสำรอง: หา User คนไหนก็ได้ที่มี line_user_id (ID จริงของ LINE)
          const { data: anyUser } = await supabase
            .from("profiles")
            .select("line_user_id, line_id")
            .not("line_user_id", "is", null)
            .neq("line_user_id", "")
            .limit(1)
            .maybeSingle();

          if (anyUser?.line_user_id) {
            return anyUser.line_user_id;
          } else if (anyUser?.line_id && anyUser.line_id.startsWith("U") && anyUser.line_id.length === 33) {
            return anyUser.line_id;
          }

          // 3. แผนสำรองสุดท้าย: ลองเช็ค line_id ของ ADMIN เผื่อใส่สลับกัน
          const { data: adminIdOnly } = await supabase
            .from("profiles")
            .select("line_id")
            .eq("role", "ADMIN")
            .not("line_id", "is", null)
            .neq("line_id", "")
            .limit(1)
            .maybeSingle();

          return adminIdOnly?.line_id || null;
        },
        ["line-admin-user-id-fallback"],
        { revalidate: 31536000, tags: ["profiles", "line-admin-id"] }
      )() || undefined;
    } catch (err) {
      console.error("Error looking up admin LINE user ID:", err);
    }
  }

  if (!userId) {
    console.warn(
      "⚠️ [LINE] ไม่สามารถส่งแจ้งเตือนได้: ไม่พบ LINE_ADMIN_USER_ID ใน .env/ตั้งค่าระบบ และไม่มีโปรไฟล์ผู้ใดผูก LINE Bot User ID (เริ่มต้นด้วยตัว U)",
    );
    console.info(
      "💡 วิธีแก้: กรุณากรอก LINE Bot User ID (พิมพ์ /id ในแชทบอทเพื่อรับค่านี้) ในหน้าแก้ไขโปรไฟล์ของคุณ หรือตั้งค่า LINE_ADMIN_USER_ID ใน .env",
    );
    return;
  }

  // Prepare message payload
  const messages =
    typeof message === "string" ? [{ type: "text", text: message }] : [message];

  try {
    const response = await fetch(LINE_MESSAGING_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("เกิดข้อผิดพลาดในการส่งแจ้งเตือน LINE:", errorData);
    }
  } catch (error) {
    console.error("ไม่สามารถส่งแจ้งเตือน LINE ได้:", error);
  }
}

/**
 * ส่งข้อความแบบ Broadcast ไปยังทุกคนที่ติดตาม Line OA
 */
export async function broadcastLineMessage(
  message: string | Record<string, any>,
) {
  let token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    try {
      const settings = await getSiteSettings();
      token = settings.line_channel_access_token || undefined;
    } catch (e) {
      console.warn("Failed to fetch site settings for line broadcast:", e);
    }
  }

  if (!token) {
    console.error("ไม่พบ LINE_CHANNEL_ACCESS_TOKEN");
    return { success: false, message: "Missing token" };
  }

  const messages =
    typeof message === "string" ? [{ type: "text", text: message }] : [message];

  try {
    const response = await fetch("https://api.line.me/v2/bot/message/broadcast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("LINE Broadcast Error:", errorData);
      return { success: false, message: errorData.message || "Line API error" };
    }

    // 🔥 LOG BROADCAST ONCE (GLOBAL)
    try {
      const supabase = createAdminClient();
      const textContent = typeof message === "string" ? message : JSON.stringify(message);
      
      let defaultTenantId: string | null = null;
      try {
        const { data: defaultTenant } = await supabase.from("tenants_v3").select("id").limit(1).maybeSingle();
        defaultTenantId = defaultTenant?.id || null;
      } catch (_) {}

      await supabase.from("communications_hub_v3").insert({
        identity_id: null,
        platform: "LINE",
        content: textContent,
        direction: 1,
        payload: { is_broadcast: true, global: true },
        tenant_id: defaultTenantId,
      });
    } catch (logErr) {
      console.error("Error logging broadcast:", logErr);
    }

    return { success: true };
  } catch (error) {
    console.error("LINE Broadcast Exception:", error);
    return { success: false, message: (error as Error).message };
  }
}

/**
 * ส่งข้อความแบบ Multicast ไปยังกลุ่มผู้ใช้ที่ระบุ (สูงสุด 500 คนต่อครั้ง)
 */
export async function multicastLineMessage(
  userIds: string[],
  message: string | Record<string, any>,
) {
  if (userIds.length === 0) return { success: true, count: 0 };

  let token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    try {
      const settings = await getSiteSettings();
      token = settings.line_channel_access_token || undefined;
    } catch (e) {
      console.warn("Failed to fetch site settings for line multicast:", e);
    }
  }

  if (!token) {
    console.error("ไม่พบ LINE_CHANNEL_ACCESS_TOKEN");
    return { success: false, message: "Missing token" };
  }

  const messages =
    typeof message === "string" ? [{ type: "text", text: message }] : [message];

  try {
    // LINE Multicast API accepts up to 500 userIds in 'to' field
    const response = await fetch("https://api.line.me/v2/bot/message/multicast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: userIds,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("LINE Multicast Error:", errorData);
      return { success: false, message: errorData.message || "Line API error" };
    }

    // Log messages to communications hub
    try {
      const supabase = createAdminClient();
      const textContent = typeof message === "string" ? message : JSON.stringify(message);
      
      let defaultTenantId: string | null = null;
      try {
        const { data: defaultTenant } = await supabase.from("tenants_v3").select("id").limit(1).maybeSingle();
        defaultTenantId = defaultTenant?.id || null;
      } catch (_) {}

      const insertRows = userIds.map(uid => ({
        identity_id: null, // We can resolve this if we do a lookup, but null works as a fallback
        platform: "LINE" as const,
        content: textContent,
        direction: 1,
        payload: { is_multicast: true, target_line_user_id: uid },
        tenant_id: defaultTenantId,
      }));

      await supabase.from("communications_hub_v3").insert(insertRows);
    } catch (logErr) {
      console.error("Error logging multicast:", logErr);
    }

    return { success: true, count: userIds.length };
  } catch (error) {
    console.error("LINE Multicast Exception:", error);
    return { success: false, message: (error as Error).message };
  }
}

/**
 * ดึงข้อมูลโปรไฟล์จาก LINE (ชื่อ และ รูป)
 */
export async function getLineProfile(userId: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return null;

  try {
    const response = await fetch(
      `https://api.line.me/v2/bot/profile/${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error("Error fetching LINE profile:", err);
    return null;
  }
}

/**
 * ดึงข้อมูลของ Bot (LINE OA)
 */
export async function getLineBotInfo() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return null;

  try {
    const response = await fetch("https://api.line.me/v2/bot/info", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error("Error fetching LINE bot info:", err);
    return null;
  }
}

/**
 * บันทึกข้อความลงในตาราง communications_hub_v3
 */
export async function saveOmniMessage(data: {
  lead_id: string;
  source: Database["public"]["Enums"]["lead_source"];
  external_message_id?: string;
  content: string;
  payload?: Json;
  direction: "INCOMING" | "OUTGOING";
  tenant_id?: string;
}) {
  const supabase = createAdminClient();
  let identity_id: string | null = null;
  let tenant_id: string | null = data.tenant_id || null;
  if (data.lead_id) {
    try {
      const { data: leadData } = await supabase
        .from("crm_leads_v3")
        .select("identity_id, tenant_id")
        .eq("id", data.lead_id)
        .single();
      if (leadData?.identity_id) {
        identity_id = leadData.identity_id;
      }
      if (leadData?.tenant_id && !tenant_id) {
        tenant_id = leadData.tenant_id;
      }
    } catch (err) {
      console.warn("[saveOmniMessage] Failed to fetch lead data:", err);
    }
  }

  if (!tenant_id) {
    try {
      const { data: defaultTenant } = await supabase
        .from("tenants_v3")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (defaultTenant) {
        tenant_id = defaultTenant.id;
      }
    } catch (_) {}
  }

  if (!identity_id || !tenant_id) {
    console.warn("[saveOmniMessage] Skipped insert into communications_hub_v3 due to missing identity_id or tenant_id", { identity_id, tenant_id });
    return;
  }

  const { error } = await supabase.from("communications_hub_v3").insert({
    identity_id,
    platform: data.source,
    external_message_id: data.external_message_id || null,
    content: data.content,
    payload: data.payload || null,
    direction: data.direction === "INCOMING" ? 0 : 1,
    tenant_id: tenant_id,
  });

  if (error) {
    console.error("Error saving omni message:", error);
  }
}

