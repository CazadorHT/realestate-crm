import { createAdminClient } from "@/lib/supabase/admin";
import { Database } from "@/lib/database.types";
import { Json } from "@/lib/database.types.generated";

const LINE_MESSAGING_API = "https://api.line.me/v2/bot/message/push";

export async function sendLineNotification(
  message: string | Record<string, any>,
) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  let userId = process.env.LINE_ADMIN_USER_ID;

  if (!token) {
    console.error("ไม่พบ LINE_CHANNEL_ACCESS_TOKEN ในการตั้งค่า");
    return;
  }

  // ถ้าไม่มี ID ใน ENV ให้ลองหาจากฐานข้อมูลแทน
  if (!userId) {
    try {
      const supabase = createAdminClient();
      // พยายามหาแอดมินคนแรกที่มี line_user_id หรือ line_id
      const { data } = await supabase
        .from("profiles")
        .select("line_user_id, line_id")
        .eq("role", "ADMIN")
        .or("line_user_id.not.is.null,line_id.not.is.null")
        .limit(1)
        .single();

      if (data?.line_user_id || data?.line_id) {
        userId = (data.line_user_id || data.line_id) ?? undefined;
      } else {
        // แผนสำรอง: ถ้าไม่มีแอดมิน ให้ลองหา User คนไหนก็ได้
        const { data: anyUser } = await supabase
          .from("profiles")
          .select("line_user_id, line_id")
          .or("line_user_id.not.is.null,line_id.not.is.null")
          .limit(1)
          .single();
        if (anyUser?.line_user_id || anyUser?.line_id) {
          userId = (anyUser.line_user_id || anyUser.line_id) ?? undefined;
        }
      }
    } catch (dbError) {
      console.warn("ไม่สามารถดึง Line ID จากฐานข้อมูลได้:", dbError);
    }
  }

  if (!userId) {
    console.warn(
      "⚠️ [LINE] ไม่สามารถส่งแจ้งเตือนได้: ไม่พบ LINE_ADMIN_USER_ID ใน .env และไม่มี Admin คนไหนผูก Line ไว้ในฐานข้อมูล",
    );
    console.info(
      "💡 วิธีแก้: กรุณาเพิ่ม LINE_ADMIN_USER_ID=ของคุณ ในไฟล์ .env หรือ พิมพ์คำสั่ง /id ในแชทบอทเพื่อดู ID ของคุณ",
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
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
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
      
      await supabase.from("communications_hub_v3").insert({
        identity_id: null,
        platform: "LINE",
        content: textContent,
        direction: 1,
        payload: { is_broadcast: true, global: true }
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
  if (data.lead_id) {
    const { data: leadData } = await supabase
      .from("crm_leads_v3")
      .select("identity_id")
      .eq("id", data.lead_id)
      .single();
    if (leadData?.identity_id) {
      identity_id = leadData.identity_id;
    }
  }

  const { error } = await supabase.from("communications_hub_v3").insert({
    identity_id,
    platform: data.source,
    external_message_id: data.external_message_id || null,
    content: data.content,
    payload: data.payload || null,
    direction: data.direction === "INCOMING" ? 0 : 1,
    tenant_id: data.tenant_id || null,
  });

  if (error) {
    console.error("Error saving omni message:", error);
  }
}

