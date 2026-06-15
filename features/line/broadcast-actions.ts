"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt, isEncrypted } from "@/lib/crypto";
import { broadcastLineMessage, multicastLineMessage } from "@/lib/line";

// Replicate subsource mapping to avoid client/server import issues
function getSubSourceLabel(lead: any): string | null {
  const note = (lead.note || lead.ai_summary || "").toLowerCase();
  const utmData = (lead.utm_data as Record<string, any>) || {};
  const prefNote = (utmData.preferences?.note || "").toLowerCase();
  const utmNote = (utmData.note || "").toLowerCase();
  const combined = `${note} ${prefNote} ${utmNote}`;

  if (combined.includes("footer newsletter") || combined.includes("subscribe") || combined.includes("ข่าวสาร")) {
    return "สมัครรับข่าวสาร";
  }
  if (combined.includes("feed") || combined.includes("comment") || combined.includes("คอมเมนต์") || combined.includes("คอมเม้น")) {
    return "คอมเมนต์";
  }
  if (
    combined.includes("messenger") ||
    combined.includes("chat") ||
    combined.includes("ทักแชต") ||
    combined.includes("line") ||
    combined.includes("whatsapp") ||
    combined.includes("telegram") ||
    combined.includes("profile") ||
    combined.includes("dm")
  ) {
    return "ช่องแชท";
  }
  if (combined.includes("wechat") || combined.includes("วีแชต") || combined.includes("วีแชท")) {
    return "วีแชท (WeChat)";
  }
  if (combined.includes("leadgen") || combined.includes("lead ad")) {
    return "โฆษณา Lead Ad";
  }
  if (lead.source === "WEBSITE") {
    const hasPropertyType = !!utmData.property_type;
    const hasPropertyId = !!utmData.property_id || !!lead.property_id;
    if (hasPropertyType || combined.includes("ฝาก") || combined.includes("deposit")) {
      return "ฝากทรัพย์";
    }
    if (hasPropertyId || combined.includes("สนใจ") || combined.includes("inquiry")) {
      return "สนใจทรัพย์";
    }
    return "เว็บทั่วไป";
  }
  return null;
}

export type BroadcastSegment = "ALL" | "NEWSLETTER" | "INQUIRY" | "DEPOSIT";

export async function getLineFollowersCountAction() {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    const supabase = createAdminClient();
    
    // Fetch all leads with identity details
    const { data: leads, error } = await supabase
      .from("crm_leads_v3")
      .select("source, utm_data, ai_summary, identity:identities_v3!crm_leads_v3_identity_id_fkey(line_id)");

    if (error) throw error;

    let totalWithLine = 0;
    let validLineUserIds = 0;
    const segmentCounts: Record<BroadcastSegment, { total: number; valid: number }> = {
      ALL: { total: 0, valid: 0 },
      NEWSLETTER: { total: 0, valid: 0 },
      INQUIRY: { total: 0, valid: 0 },
      DEPOSIT: { total: 0, valid: 0 },
    };

    for (const lead of (leads || [])) {
      const rawLineId = lead.identity?.line_id;
      if (!rawLineId) continue;

      let decryptedLineId = rawLineId;
      if (isEncrypted(rawLineId)) {
        decryptedLineId = decrypt(rawLineId) || "";
      }

      if (!decryptedLineId.trim()) continue;

      totalWithLine++;
      const isValidUser = decryptedLineId.startsWith("U") && decryptedLineId.length === 33;
      if (isValidUser) {
        validLineUserIds++;
      }

      // Classify lead subsource
      const mappedLead = {
        ...lead,
        note: lead.ai_summary || null,
      };
      const subsource = getSubSourceLabel(mappedLead);

      // Map to segments
      let segment: BroadcastSegment | null = null;
      if (subsource === "สมัครรับข่าวสาร") segment = "NEWSLETTER";
      else if (subsource === "สนใจทรัพย์") segment = "INQUIRY";
      else if (subsource === "ฝากทรัพย์") segment = "DEPOSIT";

      if (segment) {
        segmentCounts[segment].total++;
        if (isValidUser) {
          segmentCounts[segment].valid++;
        }
      }
    }

    segmentCounts.ALL = { total: totalWithLine, valid: validLineUserIds };

    return {
      success: true,
      data: segmentCounts
    };
  } catch (err) {
    console.error("Error in getLineFollowersCountAction:", err);
    return {
      success: false,
      message: "ไม่สามารถดึงสถิติผู้ติดตามไลน์ได้"
    };
  }
}

export async function sendBroadcastAction(
  targetSegment: BroadcastSegment,
  messageText: string
) {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    if (!messageText || !messageText.trim()) {
      return { success: false, message: "กรุณากรอกข้อความที่จะบรอดแคสต์" };
    }

    const supabase = createAdminClient();

    // 1. If sending globally, use LINE Broadcast API
    if (targetSegment === "ALL") {
      console.log(`[BROADCAST] Sending global broadcast to all followers...`);
      const result = await broadcastLineMessage(messageText);
      return result;
    }

    // 2. Query targeted segment leads
    const { data: leads, error } = await supabase
      .from("crm_leads_v3")
      .select("source, utm_data, ai_summary, identity:identities_v3!crm_leads_v3_identity_id_fkey(line_id)");

    if (error) throw error;

    const targetUserIds: string[] = [];

    for (const lead of (leads || [])) {
      const rawLineId = lead.identity?.line_id;
      if (!rawLineId) continue;

      let decryptedLineId = rawLineId;
      if (isEncrypted(rawLineId)) {
        decryptedLineId = decrypt(rawLineId) || "";
      }

      const isValidUser = decryptedLineId.startsWith("U") && decryptedLineId.length === 33;
      if (!isValidUser) continue;

      // Classify lead subsource
      const mappedLead = {
        ...lead,
        note: lead.ai_summary || null,
      };
      const subsource = getSubSourceLabel(mappedLead);

      let segment: BroadcastSegment | null = null;
      if (subsource === "สมัครรับข่าวสาร") segment = "NEWSLETTER";
      else if (subsource === "สนใจทรัพย์") segment = "INQUIRY";
      else if (subsource === "ฝากทรัพย์") segment = "DEPOSIT";

      if (segment === targetSegment) {
        targetUserIds.push(decryptedLineId);
      }
    }

    if (targetUserIds.length === 0) {
      return { success: false, message: "ไม่พบผู้ใช้ที่มี LINE User ID ตรงกับกลุ่มเป้าหมายนี้" };
    }

    console.log(`[BROADCAST] Multicasting to ${targetUserIds.length} users in segment ${targetSegment}...`);
    
    // Split into chunks of 500 (LINE Multicast limit)
    const chunkSize = 500;
    let successCount = 0;
    for (let i = 0; i < targetUserIds.length; i += chunkSize) {
      const chunk = targetUserIds.slice(i, i + chunkSize);
      const res = await multicastLineMessage(chunk, messageText);
      if (res.success) {
        successCount += chunk.length;
      } else {
        console.error(`[BROADCAST] Chunk multicast failed:`, res.message);
      }
    }

    return {
      success: true,
      message: `ส่งบรอดแคสต์หาผู้ใช้กลุ่มเป้าหมายสำเร็จ ${successCount} จากทั้งหมด ${targetUserIds.length} รายการ`
    };
  } catch (err) {
    console.error("Error in sendBroadcastAction:", err);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการส่งบรอดแคสต์"
    };
  }
}
