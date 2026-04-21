"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function subscribeToLineAction(
  lineId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    if (!lineId || !lineId.trim()) {
      return { success: false, message: "กรุณากรอก Line ID" };
    }

    const supabase = createAdminClient();

    // Check if this Line ID already exists to avoid duplicates (Optional but good practice)
    // For now, we'll just insert a new lead or maybe Upsert?
    // Let's just Insert for simplicity, sales can merge later.

    const { error } = await supabase.from("leads").insert({
      full_name: `Line Contact: ${lineId}`,
      line_id: lineId.trim(),
      source: "WEBSITE", // Main source is Website
      stage: "NEW",
      note: "Subscribe via Footer Newsletter",
      lead_type: "INDIVIDUAL",
    });

    if (error) {
      console.error("Error creating line lead:", error);
      return { success: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
    }

    revalidatePath("/protected/leads"); // Update CRM list

    // 🤖 Trigger AI Smart Match Infrastructure (If lead ID was returned)
    const { data: leadIdRes } = await supabase
      .from("leads")
      .select("id")
      .eq("line_id", lineId.trim())
      .single();

    if (leadIdRes) {
      const { inngest } = await import("@/lib/inngest/client");
      await inngest.send({
        name: "lead.created",
        data: { leadId: leadIdRes.id }
      });
    }

    return { success: true, message: "บันทึกข้อมูลเรียบร้อยแล้ว" };
  } catch (error) {
    console.error("Error in subscribeToLineAction:", error);
    return { success: false, message: "เกิดข้อผิดพลาดที่ไม่คาดคิด" };
  }
}
