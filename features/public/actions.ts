"use server";

import { createClient } from "@/lib/supabase/server";
import { DepositLeadInput } from "./types";
import { depositLeadSchema } from "./schema";

export async function createDepositLeadAction(data: DepositLeadInput) {
  // Server-side validation
  const parsed = depositLeadSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: "ข้อมูลไม่ถูกต้อง" };
  }

  const supabase = await createClient();

  // Create Lead
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      full_name: data.fullName,
      phone: data.phone,
      lead_type: "INDIVIDUAL",
      source: "WEBSITE",
      stage: "NEW",
      note: `[ฝากทรัพย์] Line: ${data.lineId || "-"}
Type: ${data.propertyType}
Details: ${data.details || "-"}`,
    })
    .select()
    .single();

  if (leadError) {
    console.error("Deposited Lead Error:", leadError);
    return { success: false, message: "เกิดข้อผิดพลาด กรุณาลองใหม่" };
  }

  // Create Initial Activity
  await supabase.from("lead_activities").insert({
    lead_id: lead.id,
    activity_type: "SYSTEM",
    note: "ลูกค้าแจ้งฝากทรัพย์ผ่านหน้าเว็บไซต์",
  });

  return { success: true, leadId: lead.id };
}
