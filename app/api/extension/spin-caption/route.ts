import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai/gemini";

export const maxDuration = 45;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface SpinCaptionRequest {
  property: {
    id: string;
    title: string;
    description?: string;
    listingType?: string;
    propertyType?: string;
    salePrice?: number | null;
    rentPrice?: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    sizeSqm?: number | null;
    district?: string;
    popularArea?: string;
    publicUrl?: string;
  };
  groupName?: string;
  angle?: "general" | "expat_en" | "investor" | "pet_friendly";
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  const expectedToken = process.env.VCC_EXTENSION_API_TOKEN?.trim();
  if (expectedToken) {
    const authHeader = req.headers.get("authorization") || "";
    const provided = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!provided || provided !== expectedToken) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401, headers: CORS_HEADERS },
      );
    }
  }

  try {
    const body = (await req.json()) as SpinCaptionRequest;
    const p = body.property;
    if (!p?.title) {
      return NextResponse.json(
        { ok: false, error: "Missing property data" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const angle = body.angle || "general";
    const angleGuide: Record<string, string> = {
      general: "ภาษาไทยอ่านง่าย พรีเมียม น่าทัก เน้นความคุ้มค่าและพร้อมเข้าอยู่",
      expat_en: "Write primarily in crisp, inviting English for Expats/Foreigners with a short Thai summary line",
      investor: "เน้นมุมการลงทุน Yield / ราคาคุ้มค่ากว่าตลาด / ศักยภาพทำเล",
      pet_friendly: "เน้นจุดขาย Pet-Friendly / พื้นที่กว้าง / เหมาะกับคนเลี้ยงสัตว์",
    };

    const trackingUrl = p.publicUrl
      ? `${p.publicUrl}${p.publicUrl.includes("?") ? "&" : "?"}src=fb_grp`
      : "";

    const prompt = `คุณคือนายหน้ามืออาชีพของ VCC Asset
ช่วยเขียนแคปชันโพสต์ลงกลุ่ม Facebook / Marketplace สำหรับทรัพย์นี้ โดย **เปลี่ยนพาดหัวและการเรียงจุดขายให้สดใหม่ไม่ซ้ำโพสต์เดิม**

กลุ่มเป้าหมาย: ${body.groupName || "กลุ่มอสังหาฯ Facebook"}
สไตล์ที่ต้องการ: ${angleGuide[angle] || angleGuide.general}

ข้อมูลทรัพย์:
- หัวข้อ: ${p.title}
- ประเภท: ${p.propertyType || "CONDO"} (${p.listingType || "RENT"})
- ราคาขาย: ${p.salePrice ? `${p.salePrice.toLocaleString()} บาท` : "-"}
- ค่าเช่า: ${p.rentPrice ? `${p.rentPrice.toLocaleString()} บาท/เดือน` : "-"}
- ขนาด: ${p.sizeSqm ? `${p.sizeSqm} ตร.ม.` : "-"} | ${p.bedrooms ?? "-"} ห้องนอน ${p.bathrooms ?? "-"} ห้องน้ำ
- ทำเล: ${p.popularArea || p.district || "-"}
- รายละเอียดเดิม: ${(p.description || "").slice(0, 900)}

กติกาเหล็ก (สำคัญมาก):
1. **ขอเนื้อๆ ไม่มีน้ำ!** ห้ามเขียนย่อหน้าเกริ่นนำยาวๆ แบบ "หากคุณกำลังมองหา...", "สัมผัสประสบการณ์...", "ตอบโจทย์ไลฟ์สไตล์..." เด็ดขาด
2. **ห้ามใส่ลิงก์ URL (http/https/www) ในเนื้อหาโพสต์เด็ดขาด!** (เพื่อกัน Facebook ปิดการมองเห็น) ให้เขียน CTA สั้นๆ เช่น "📩 สนใจนัดชมหรือขอรูปเพิ่ม ทักแชทได้เลยครับ"
3. **ขึ้นต้นบรรทัดแรกด้วยคำว่า [Agent Post]** (ระบุชัดเจนว่าเป็นโพสต์เอเจนท์ เพื่อให้ถูกกฎกลุ่มอสังหาฯ) และ **ใส่ Emoji นำหน้าทุกบรรทัด/หัวข้อ** ให้สแกนอ่านจบใน 5 วินาที เช่น:
   🔥 [Agent Post] พาดหัวสั้นคม 1 บรรทัด (ประเภท + ชื่อโครงการ + ทำเล)
   💰 ราคาขาย/เช่า + เงื่อนไขสัญญา
   📏 พื้นที่ใช้สอย / ที่ดิน | 🛏️ ห้องนอน/ห้องน้ำ | 🚗 ที่จอดรถ
   ✅ จุดเด่นสั้นๆ กระชับ 3-4 บรรทัด (ใช้ ✅ หรือ ✨ นำหน้า ห้ามใช้ขีด -)
   📍 ทำเล / ใกล้รถไฟฟ้าหรือสถานที่สำคัญ
   📩 สนใจนัดชมหรือขอรูปเพิ่ม ทักแชทได้เลยครับ (ยินดีรับ Co-Agent)
4. ใช้ Plain Text เท่านั้น ห้ามใช้ Markdown (** หรือ # หัวข้อ) หรือ HTML
5. ห้ามแต่งตัวเลขราคา/ขนาดใหม่ ใช้ตามข้อมูลจริงเท่านั้น
6. ไม่ต้องใส่เบอร์โทร/Line/WeChat (ระบบจะแนบท้ายให้เอง)
7. ปิดท้ายด้วยแฮชแท็ก 4-6 คำที่เกี่ยวข้อง ส่งกลับมาเฉพาะข้อความแคปชันพร้อมโพสต์เท่านั้น`;

    const aiRes = await generateText(prompt);
    const caption = aiRes.text
      .trim()
      .replace(/^```(?:\w+)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .replace(/https?:\/\/\S+/gi, "")
      .trim();

    const firstComment = trackingUrl
      ? `🔗 ดูรูปภาพ HD และรายละเอียดเพิ่มเติมทั้งหมดได้ที่นี่ครับ:\n${trackingUrl}`
      : "";

    return NextResponse.json({ ok: true, caption, firstComment }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("[SpinCaption] Error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Spin caption failed" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
