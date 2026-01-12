"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DepositLeadInput, LeadState } from "./types";
import { depositLeadSchema, inquiryLeadSchema } from "./schema";

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

export async function submitInquiryAction(
  prevState: LeadState,
  formData: FormData
): Promise<LeadState> {
  const supabase = createAdminClient();

  const validatedFields = inquiryLeadSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    lineId: formData.get("lineId"),
    message: formData.get("message"),
    propertyId: formData.get("propertyId"),
    source: "WEBSITE",
  });

  if (!validatedFields.success) {
    return {
      error: "ข้อมูลไม่ถูกต้อง",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { data } = validatedFields;
  try {
    const { error } = await supabase.from("leads").insert({
      full_name: data.fullName,
      phone: data.phone,
      // @ts-ignore
      line_id: data.lineId || null,
      note: data.message || null,
      property_id: data.propertyId || null,
      source: "WEBSITE",
      stage: "NEW", // Use 'stage' not 'lead_stage' based on database types seen earlier (leads: stage: lead_stage enum)
    });

    if (error) {
      console.error("Supabase Error:", error);
      return { error: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง" };
    }

    return { success: true };
  } catch (err) {
    console.error("Server Error:", err);
    return { error: "เกิดข้อผิดพลาดทางเทคนิค" };
  }
}
