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
ช่วยเขียนแคปชันโพสต์ลงกลุ่ม Facebook สำหรับทรัพย์นี้ โดย **เปลี่ยนสำนวน พาดหัว และการเรียงจุดขายให้สดใหม่ไม่ซ้ำกับโพสต์เดิม** (เพื่อกัน Facebook มองเป็นข้อความซ้ำ)

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

กติกา:
1. เขียนแบบ Plain Text พร้อม Emoji ให้อ่านง่ายบน Facebook (ห้ามใช้ Markdown ** หรือ HTML)
2. ห้ามแต่งตัวเลขราคา/ขนาดใหม่ ใช้ตามข้อมูลจริงเท่านั้น
3. ใส่ Call to Action ให้ทักแชทเพื่อนัดชมห้อง + แนบลิงก์ดูรูปเพิ่ม: ${trackingUrl || "(ไม่ต้องใส่ลิงก์)"}
4. ปิดท้ายด้วยแฮชแท็ก 4-6 คำที่เกี่ยวข้อง
5. ส่งกลับมาเฉพาะข้อความแคปชันพร้อมโพสต์เท่านั้น`;

    const aiRes = await generateText(prompt);
    const caption = aiRes.text
      .trim()
      .replace(/^```(?:\w+)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    return NextResponse.json({ ok: true, caption }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("[SpinCaption] Error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Spin caption failed" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
