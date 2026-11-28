import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { generateText } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redis } from "@/lib/redis";

export const maxDuration = 60;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ExtensionPolishRequest {
  rawText: string;
  authorName?: string;
  authorUrl?: string;
  postUrl?: string;
  groupName?: string;
  phones?: string[];
  lineIds?: string[];
  images?: string[];
}

async function uploadImagesToStorage(
  imageUrls: string[],
  draftId: string,
): Promise<string[]> {
  const uniqueUrls = Array.from(
    new Set(imageUrls.filter((u) => /^https?:\/\//i.test(u))),
  ).slice(0, 25);
  if (uniqueUrls.length === 0) return [];

  const adminSupabase = createAdminClient();
  const uploadedPaths: string[] = [];

  // Process in batches of 4 for speed without overwhelming memory
  const BATCH_SIZE = 4;
  for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
    const batch = uniqueUrls.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (url, idx) => {
        const num = String(i + idx + 1).padStart(2, "0");
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 12000);
          const res = await fetch(url, {
            signal: controller.signal,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            },
          });
          clearTimeout(timer);
          if (!res.ok) return null;

          const rawBuf = Buffer.from(await res.arrayBuffer());
          if (rawBuf.length < 2000) return null;

          const webpBuf = await sharp(rawBuf)
            .rotate()
            .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 84 })
            .toBuffer();

          const storagePath = `vcc-import/${draftId}/${num}.webp`;
          const { error } = await adminSupabase.storage
            .from("property-images")
            .upload(storagePath, webpBuf, {
              contentType: "image/webp",
              upsert: true,
            });

          if (error) {
            console.warn("[VCC Extension] image upload error:", error.message);
            return null;
          }
          return storagePath;
        } catch (err) {
          console.warn("[VCC Extension] image fetch/convert failed:", err);
          return null;
        }
      }),
    );

    for (const p of results) {
      if (p) uploadedPaths.push(p);
    }
  }

  return uploadedPaths;
}

interface StoredImportDraft {
  createdAt: number;
  authorName: string;
  postUrl: string;
  socialPost: string;
  formValues: Record<string, unknown>;
}

const globalStore = globalThis as unknown as {
  __vccImportDrafts?: Map<string, StoredImportDraft>;
};
const draftStore = (globalStore.__vccImportDrafts ??= new Map<string, StoredImportDraft>());

function pruneExpiredDrafts() {
  const cutoff = Date.now() - 30 * 60 * 1000; // 30 minutes
  for (const [key, val] of draftStore.entries()) {
    if (val.createdAt < cutoff) draftStore.delete(key);
  }
}

async function saveImportDraft(id: string, draft: StoredImportDraft): Promise<void> {
  draftStore.set(id, draft);
  if (redis) {
    try {
      await redis.set(`vcc_import:${id}`, draft, { ex: 1800 });
    } catch (err) {
      console.warn("[VCC Extension] Redis save failed, using memory fallback:", err);
    }
  }
}

async function loadImportDraft(id: string): Promise<StoredImportDraft | null> {
  if (redis) {
    try {
      const fromRedis = await redis.get<StoredImportDraft>(`vcc_import:${id}`);
      if (fromRedis) return fromRedis;
    } catch (err) {
      console.warn("[VCC Extension] Redis read failed, using memory fallback:", err);
    }
  }
  return draftStore.get(id) ?? null;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  pruneExpiredDrafts();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Missing draft id" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const draft = await loadImportDraft(id);
  if (!draft) {
    return NextResponse.json(
      { ok: false, error: "Draft expired or not found" },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json({ ok: true, draft }, { headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  pruneExpiredDrafts();

  // Production security: if VCC_EXTENSION_API_TOKEN is set in env, enforce Bearer token
  const expectedToken = process.env.VCC_EXTENSION_API_TOKEN?.trim();
  if (expectedToken) {
    const authHeader = req.headers.get("authorization") || "";
    const provided = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!provided || provided !== expectedToken) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: Extension API Token ไม่ถูกต้อง กรุณาตั้งค่าในแท็บ CRM" },
        { status: 401, headers: CORS_HEADERS },
      );
    }
  }

  try {
    const body = (await req.json()) as ExtensionPolishRequest;
    const rawText = body.rawText?.trim();
    if (!rawText || rawText.length < 10) {
      return NextResponse.json(
        { ok: false, error: "กรุณาส่งข้อความโพสต์อย่างน้อย 10 ตัวอักษร" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const authorName = body.authorName?.trim() || "เจ้าของทรัพย์";
    const postUrl = body.postUrl?.trim() || "";
    const phones = body.phones ?? [];
    const lineIds = body.lineIds ?? [];

    const prompt = `คุณเป็นผู้เชี่ยวชาญด้านอสังหาริมทรัพย์และ SEO ของ VCC Asset
งานของคุณคืออ่านประกาศดิบจากเจ้าของทรัพย์ด้านล่าง แล้ว:
1) แกะข้อมูลลงฟิลด์ CRM ให้แม่นยำ (ห้ามมั่วตัวเลข ถ้าไม่มีให้ใส่ null)
2) เกลาโพสต์ประกาศตามโครงสร้าง 7 ส่วนมาตรฐานของ VCC Asset (ตัดเบอร์โทรและ LINE ของเจ้าของออกทั้งหมด เพื่อนำไปลงเว็บและโซเชียลของเอเจนซี่):
   - ส่วนที่ 1: SEO Titles 4 ภาษา (TH / EN / ZH / RU) สูตร: [ประเภทธุรกรรม + ประเภททรัพย์] + [ชื่อโครงการ] + [จำนวนห้อง + ขนาด + ชั้น/ทิศ] + [จุดขายเด่น] + [แลนด์มาร์ก/รถไฟฟ้า]
   - ส่วนที่ 2: พาดหัวหลักและสรุปจุดเด่นทำเล (FOR SALE & RENT | ขายและให้เช่า ... + ✅ Prime [ย่าน] Location)
   - ส่วนที่ 3: เงื่อนไขราคาและสัญญา (🏷️ ราคาขาย, 💵 ค่าเช่า, 🔒 มัดจำ+ล่วงหน้า, ✨ สถานะห้อง)
   - ส่วนที่ 4: ข้อมูลพื้นฐานของทรัพย์ (📏 ขนาด ตร.ม./ตร.ว., อาคาร, ชั้น, ทิศ/วิว, 🛋️ รูปแบบห้อง)
   - ส่วนที่ 5: จุดเด่นการตกแต่ง เครื่องใช้ไฟฟ้า และเฟอร์นิเจอร์ในห้อง (✨ 📺 🛏️)
   - ส่วนที่ 6: ส่วนกลางโครงการ ความปลอดภัย และสถานที่ใกล้เคียง (🏊 🛡️ 📍)
   - ส่วนที่ 7: Call to Action & แฮชแท็ก (#ชื่อโครงการ #ทำเล #ประเภททรัพย์) โดยเว้นช่องติดต่อเป็น [ติดต่อ VCC Asset] (ห้ามใส่เบอร์/LINE เจ้าของ)

ข้อความประกาศต้นฉบับจากเจ้าของ:
"""
${rawText}
"""

ตอบกลับเป็น JSON เท่านั้น (ห้ามใส่ markdown code block \`\`\`json) ตามโครงสร้างนี้:
{
  "title": "SEO Title ภาษาไทย",
  "title_en": "SEO Title English",
  "title_cn": "SEO Title Simplified Chinese",
  "title_ru": "SEO Title Russian",
  "description_html": "เนื้อหาส่วนที่ 2-6 จัดรูปแบบด้วย HTML Tags (<h2>, <p>, <ul>, <li>, <strong>) พร้อม Emoji สวยงาม ห้ามใส่เบอร์เจ้าของ",
  "social_post": "โพสต์พร้อมลงโซเชียลครบทั้ง 7 ส่วน (รวมหัวข้อและแฮชแท็ก) พร้อม Emoji แบบ Plain Text ห้ามใส่เบอร์เจ้าของ",
  "property_type": "CONDO | HOUSE | TOWNHOME | LAND | COMMERCIAL_BUILDING | WAREHOUSE | OFFICE_BUILDING | VILLA | POOL_VILLA | HOME_OFFICE | OTHER",
  "listing_type": "SALE | RENT | SALE_AND_RENT",
  "price": number หรือ null (ราคาขายสุทธิเป็นตัวเลขบาท เช่น 4500000),
  "rental_price": number หรือ null (ค่าเช่าต่อเดือนเป็นตัวเลขบาท เช่น 18000),
  "size_sqm": number หรือ null,
  "land_size_sqwah": number หรือ null,
  "bedrooms": number หรือ null,
  "bathrooms": number หรือ null,
  "floor": number หรือ null,
  "min_contract_months": number หรือ null,
  "orientation": "N" | "S" | "E" | "W" | "NE" | "NW" | "SE" | "SW" | null,
  "province": "ชื่อจังหวัดภาษาไทย เช่น กรุงเทพมหานคร" หรือ null,
  "district": "ชื่อเขต/อำเภอภาษาไทย เช่น วัฒนา" หรือ null,
  "subdistrict": "ชื่อแขวง/ตำบลภาษาไทย" หรือ null,
  "popular_area": "ย่านยอดนิยม เช่น อโศก / ทองหล่อ / ราชเทวี" หรือ null,
  "transit_station_name": "ชื่อสถานีรถไฟฟ้าใกล้สุด เช่น BTS ราชเทวี" หรือ null,
  "transit_distance_meters": number หรือ null,
  "is_pet_friendly": boolean,
  "is_fully_furnished": boolean,
  "is_renovated": boolean,
  "is_corner_unit": boolean,
  "has_pool_view": boolean,
  "has_city_view": boolean
}`;

    const aiResponse = await generateText(prompt);
    const cleaned = aiResponse.text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error("AI ไม่ได้ส่ง JSON กลับมาในรูปแบบที่ถูกต้อง");
      }
      parsed = JSON.parse(match[0]);
    }

    // Best-effort match existing owner in Supabase if user has an active session
    let matchedOwnerId: string | null = null;
    try {
      const supabase = await createClient();
      if (phones[0]) {
        const { data } = await supabase
          .from("owners")
          .select("id")
          .ilike("phone", `%${phones[0].slice(-8)}%`)
          .limit(1)
          .maybeSingle();
        if (data?.id) matchedOwnerId = data.id;
      }
      if (!matchedOwnerId && authorName && authorName !== "เจ้าของทรัพย์") {
        const { data } = await supabase
          .from("owners")
          .select("id")
          .ilike("name", `%${authorName}%`)
          .limit(1)
          .maybeSingle();
        if (data?.id) matchedOwnerId = data.id;
      }
    } catch {
      // Non-blocking if called without cookie session
    }

    const sourceParts = [
      `เจ้าของ: ${authorName}`,
      phones.length > 0 ? `โทร: ${phones.join(", ")}` : "",
      lineIds.length > 0 ? `LINE: ${lineIds.join(", ")}` : "",
      body.groupName ? `กลุ่ม: ${body.groupName}` : "",
      postUrl ? `ลิงก์อ้างอิง: ${postUrl}` : "",
    ].filter(Boolean);

    const priceNum = typeof parsed.price === "number" ? parsed.price : null;
    const rentNum = typeof parsed.rental_price === "number" ? parsed.rental_price : null;

    const draftId = randomUUID();
    const uploadedImagePaths = await uploadImagesToStorage(body.images ?? [], draftId);

    const formValues: Record<string, unknown> = {
      title: parsed.title || "",
      title_en: parsed.title_en || "",
      title_cn: parsed.title_cn || "",
      title_ru: parsed.title_ru || "",
      description: parsed.description_html || "",
      property_type: parsed.property_type || "CONDO",
      listing_type:
        parsed.listing_type ||
        (priceNum && rentNum ? "SALE_AND_RENT" : priceNum ? "SALE" : "RENT"),
      status: "DRAFT",
      price: priceNum,
      original_price: priceNum ?? undefined,
      rental_price: rentNum,
      original_rental_price: rentNum ?? undefined,
      size_sqm: typeof parsed.size_sqm === "number" ? parsed.size_sqm : null,
      land_size_sqwah: typeof parsed.land_size_sqwah === "number" ? parsed.land_size_sqwah : null,
      bedrooms: typeof parsed.bedrooms === "number" ? parsed.bedrooms : undefined,
      bathrooms: typeof parsed.bathrooms === "number" ? parsed.bathrooms : undefined,
      floor: typeof parsed.floor === "number" ? parsed.floor : null,
      min_contract_months:
        typeof parsed.min_contract_months === "number" ? parsed.min_contract_months : null,
      orientation: parsed.orientation || null,
      province: parsed.province || undefined,
      district: parsed.district || undefined,
      subdistrict: parsed.subdistrict || undefined,
      popular_area: parsed.popular_area || null,
      near_transit: Boolean(parsed.transit_station_name),
      transit_station_name: parsed.transit_station_name || null,
      transit_distance_meters:
        typeof parsed.transit_distance_meters === "number" ? parsed.transit_distance_meters : null,
      is_pet_friendly: Boolean(parsed.is_pet_friendly),
      is_fully_furnished: Boolean(parsed.is_fully_furnished),
      is_renovated: Boolean(parsed.is_renovated),
      is_corner_unit: Boolean(parsed.is_corner_unit),
      has_pool_view: Boolean(parsed.has_pool_view),
      has_city_view: Boolean(parsed.has_city_view),
      // Step 4: Images, Owner & Source Reference
      images: uploadedImagePaths.length > 0 ? uploadedImagePaths : undefined,
      owner_id: matchedOwnerId,
      property_source: sourceParts.join(" | "),
    };

    const socialPost =
      typeof parsed.social_post === "string" ? parsed.social_post : String(parsed.title || "");

    await saveImportDraft(draftId, {
      createdAt: Date.now(),
      authorName,
      postUrl,
      socialPost,
      formValues,
    });

    return NextResponse.json(
      {
        ok: true,
        draftId,
        crmPath: `/protected/properties/new?vcc_import=${draftId}`,
        matchedOwnerId,
        uploadedImageCount: uploadedImagePaths.length,
        socialPost,
        formValues,
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[VCC Extension Polish] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "ไม่สามารถเกลาข้อมูลด้วย AI ได้",
      },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
