import { createAdminClient } from "@/lib/supabase/admin";

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
      // พยายามหาแอดมินคนแรกที่มี line_id
      const { data } = await supabase
        .from("profiles")
        .select("line_id")
        .eq("role", "ADMIN") // ดึงเฉพาะคนที่เป็น ADMIN
        .not("line_id", "is", null)
        .limit(1)
        .single();

      if (data?.line_id) {
        userId = data.line_id;
      } else {
        // แผนสำรอง: ถ้าไม่มีแอดมิน ให้ลองหา User คนไหนก็ได้ที่มี line_id (เหมาะสำหรับแอพที่ใช้คนเดียว)
        const { data: anyUser } = await supabase
          .from("profiles")
          .select("line_id")
          .not("line_id", "is", null)
          .limit(1)
          .single();
        if (anyUser?.line_id) {
          userId = anyUser.line_id;
        }
      }
    } catch (dbError) {
      console.warn("ไม่สามารถดึง Line ID จากฐานข้อมูลได้:", dbError);
    }
  }

  if (!userId) {
    console.warn(
      "ไม่พบ LINE_ADMIN_USER_ID และไม่พบผู้ใช้ที่ผูก Line ในฐานข้อมูล จึงไม่สามารถส่งแจ้งเตือนได้",
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
 * บันทึกข้อความลงในตาราง omni_messages
 */
export async function saveOmniMessage(data: {
  lead_id: string;
  source:
    | "LINE"
    | "FACEBOOK"
    | "INSTAGRAM"
    | "WEBSITE"
    | "PORTAL"
    | "REFERRAL"
    | "OTHER";
  external_message_id?: string;
  content: string;
  payload?: any;
  direction: "INCOMING" | "OUTGOING";
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("omni_messages").insert({
    lead_id: data.lead_id,
    source: data.source,
    external_message_id: data.external_message_id,
    content: data.content,
    payload: data.payload,
    direction: data.direction,
  });

  if (error) {
    console.error("Error saving omni message:", error);
  }
}
