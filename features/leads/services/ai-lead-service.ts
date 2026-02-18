import { generateText } from "@/lib/ai/gemini";
import { getAiModelConfig } from "@/features/ai-settings/actions";
import { logAiUsage } from "@/features/ai-monitor/actions";
import { getLeadWithActivitiesQuery } from "../queries";

/**
 * Generates a summary for a lead based on their info and activities.
 */
export async function generateLeadSummary(leadId: string): Promise<string> {
  const lead = await getLeadWithActivitiesQuery(leadId);
  if (!lead) throw new Error("ไม่พบข้อมูลลีด");

  const activitiesText = (lead.lead_activities ?? [])
    .map(
      (a) =>
        `- [${new Date(a.created_at).toLocaleDateString("th-TH")}] ${
          a.activity_type
        }: ${a.note}`,
    )
    .join("\n");

  const prompt = `
    คุณเป็นผู้ช่วยเอเจนต์อสังหาริมทรัพย์มืออาชีพ
    หน้าที่ของคุณคือสรุปข้อมูลของลูกค้า (Lead) เพื่อให้เอเจนต์เข้าใจภาพรวมได้รวดเร็วที่สุด

    ข้อมูลลูกค้า:
    - ชื่อ: ${lead.full_name}
    - สถานะปัจจุบัน: ${lead.stage}
    - ทำเลที่สนใจ: ${lead.preferred_locations?.join(", ") || "ไม่ระบุ"}
    - งบประมาณ: ${lead.budget_min || 0} - ${lead.budget_max || "ไม่จำกัด"}
    - สเปค: ${lead.min_bedrooms || "-"} ห้องนอน, ${
      lead.min_bathrooms || "-"
    } ห้องน้ำ, ขนาด ${lead.min_size_sqm || 0}-${
      lead.max_size_sqm || "ไม่จำกัด"
    } ตร.ม.
    - อื่นๆ: เลี้ยงสัตว์ ${lead.has_pets ? "ได้" : "ไม่ได้"}, จำนวนผู้พักอาศัย ${
      lead.num_occupants || "-"
    } คน

    ประวัติกิจกรรม:
    ${activitiesText || "ยังไม่มีประวัติกิจกรรม"}

    คำสั่ง:
    1. สรุปเป็น 3-4 บรรทัด (Bullet points) ในภาษาไทยที่เป็นทางการและจับประเด็นสำคัญ
    2. เน้นจุดที่เอเจนต์ควรให้ความสำคัญเป็นพิเศษ (เช่น งบที่แน่นอน, ความเร่งด่วน, หรือเงื่อนไขที่ห้ามขาด)
    3. ส่งกลับเฉพาะข้อความสรุป ไม่ต้องมีคำเกริ่น
    4. ใช้ Emoji เพื่อให้อ่านง่าย
  `;

  const aiConfig = await getAiModelConfig();
  const modelName = aiConfig.lead_model;

  try {
    const summary = await generateText(prompt, modelName);

    await logAiUsage({
      model: modelName,
      feature: "lead_summary",
      status: "success",
    });

    return summary;
  } catch (error: any) {
    console.error("AI Lead Summary Error:", error);

    await logAiUsage({
      model: modelName || "unknown",
      feature: "lead_summary",
      status: "error",
      errorMessage: error.message,
    });
    throw new Error("ไม่สามารถสรุปข้อมูลด้วย AI ได้ในขณะนี้");
  }
}
