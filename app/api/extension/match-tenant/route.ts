import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai/gemini";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import {
  getListingTypeFromDb,
  getPropertyTypeFromDb,
  PROPERTY_STATUS_DB_VALUE,
} from "@/features/properties/labels";

export const maxDuration = 45;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface MatchTenantRequest {
  text: string;
  authorName?: string;
}

interface ParsedTenantNeeds {
  listingType: "RENT" | "SALE";
  maxBudget: number | null;
  bedrooms: number | null;
  zones: string[];
  petFriendly: boolean;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

async function parseTenantNeeds(text: string): Promise<ParsedTenantNeeds> {
  // Fast AI extraction for Thai/EN tenant post
  try {
    const prompt = `อ่านโพสต์ผู้เช่า/ผู้ซื้อที่กำลังหาห้องด้านล่าง แล้วแยกเงื่อนไขเป็น JSON เท่านั้น (ห้ามใส่ markdown \`\`\`json):
"""
${text.slice(0, 1000)}
"""
โครงสร้าง JSON:
{
  "listingType": "RENT" หรือ "SALE",
  "maxBudget": number หรือ null (บาท เช่น 18000 หรือ 4500000),
  "bedrooms": number หรือ null (เช่น 1, 2, 3 หรือ 0 สำหรับสตูดิโอ),
  "zones": ["คำค้นทำเล/โซน/สถานีรถไฟฟ้า/ชื่อโครงการ ภาษาไทยและอังกฤษที่เกี่ยวข้อง เช่น ทองหล่อ, Thonglor, BTS พร้อมพงษ์"],
  "petFriendly": boolean
}`;
    const aiRes = await generateText(prompt);
    const cleaned = aiRes.text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as Partial<ParsedTenantNeeds>;
      return {
        listingType: parsed.listingType === "SALE" ? "SALE" : "RENT",
        maxBudget: typeof parsed.maxBudget === "number" ? parsed.maxBudget : null,
        bedrooms: typeof parsed.bedrooms === "number" ? parsed.bedrooms : null,
        zones: Array.isArray(parsed.zones)
          ? parsed.zones.filter((z): z is string => typeof z === "string" && z.trim().length >= 2)
          : [],
        petFriendly: Boolean(parsed.petFriendly),
      };
    }
  } catch (err) {
    console.warn("[MatchTenant] AI parse fallback to regex:", err);
  }

  // Regex fallback
  const budgetMatch = text.match(/(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(?:บาท|บ\.|k|พัน|หมื่น|ล้าน)/i);
  let maxBudget: number | null = null;
  if (budgetMatch?.[1]) {
    const raw = parseFloat(budgetMatch[1].replace(/,/g, ""));
    if (/ล้าน/i.test(budgetMatch[0])) maxBudget = raw * 1_000_000;
    else if (/หมื่น/i.test(budgetMatch[0])) maxBudget = raw * 10_000;
    else if (/k|พัน/i.test(budgetMatch[0])) maxBudget = raw * 1_000;
    else maxBudget = raw;
  }
  const bedMatch = text.match(/(\d)\s*(?:ห้องนอน|นอน|bed)/i);
  return {
    listingType: /ซื้อ|ต้องการซื้อ|หาซื้อ/i.test(text) ? "SALE" : "RENT",
    maxBudget,
    bedrooms: bedMatch?.[1] ? parseInt(bedMatch[1], 10) : null,
    zones: [],
    petFriendly: /เลี้ยงสัตว์|สัตว์เลี้ยง|pet/i.test(text),
  };
}

export async function POST(req: NextRequest) {
  const expectedToken = process.env.VCC_EXTENSION_API_TOKEN?.trim();
  if (expectedToken) {
    const authHeader = req.headers.get("authorization") || "";
    const provided = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!provided || provided !== expectedToken) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: กรุณาตั้งค่า Extension API Token ในแท็บ CRM" },
        { status: 401, headers: CORS_HEADERS },
      );
    }
  }

  try {
    const body = (await req.json()) as MatchTenantRequest;
    const text = body.text?.trim();
    if (!text || text.length < 10) {
      return NextResponse.json(
        { ok: false, error: "ข้อความผู้เช่าสั้นเกินไป" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const needs = await parseTenantNeeds(text);
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("properties_core")
      .select(
        `
        id,
        slug,
        status,
        listing_type,
        property_type,
        sale_price,
        rent_price,
        bedrooms,
        bathrooms,
        floor_area,
        properties_details (
          title,
          description,
          address_info,
          meta_data
        ),
        property_images (
          image_url,
          storage_path,
          is_cover,
          sort_order
        )
      `,
      )
      .eq("status", PROPERTY_STATUS_DB_VALUE.ACTIVE)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(120);

    if (error) throw error;

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://vccasset.com").replace(/\/+$/, "");

    const scored = (data || [])
      .map((row: Record<string, unknown>) => {
        const detailsRaw = Array.isArray(row.properties_details)
          ? row.properties_details[0]
          : row.properties_details;
        const details = (detailsRaw || {}) as {
          title?: { th?: string; en?: string } | string;
          description?: { th?: string; en?: string } | string;
          address_info?: {
            province?: string;
            district?: string;
            subdistrict?: string;
            popular_area?: string;
          };
          meta_data?: { slug?: string };
        };

        const titleTh =
          typeof details.title === "string"
            ? details.title
            : details.title?.th || details.title?.en || "ทรัพย์ VCC Asset";
        const titleEn =
          typeof details.title === "object" && details.title ? details.title.en || "" : "";
        const descText =
          typeof details.description === "string"
            ? details.description
            : `${details.description?.th || ""} ${details.description?.en || ""}`;

        const salePrice = row.sale_price ? Number(row.sale_price) : null;
        const rentPrice = row.rent_price ? Number(row.rent_price) : null;
        const listingType =
          getListingTypeFromDb(row.listing_type as number) ||
          (salePrice && rentPrice ? "SALE_AND_RENT" : salePrice ? "SALE" : "RENT");
        const propertyType = getPropertyTypeFromDb(row.property_type as number) || "CONDO";
        const bedrooms = row.bedrooms !== null && row.bedrooms !== undefined ? Number(row.bedrooms) : null;
        const sizeSqm = row.floor_area ? Number(row.floor_area) : null;

        // Filter listing type compatibility
        const supportsRent = listingType === "RENT" || listingType === "SALE_AND_RENT";
        const supportsSale = listingType === "SALE" || listingType === "SALE_AND_RENT";
        if (needs.listingType === "RENT" && !supportsRent) return null;
        if (needs.listingType === "SALE" && !supportsSale) return null;

        let score = 10;
        const reasons: string[] = [];

        // 1) Budget scoring
        const activePrice = needs.listingType === "SALE" ? salePrice : rentPrice;
        if (needs.maxBudget && activePrice) {
          if (activePrice <= needs.maxBudget) {
            score += 35;
            reasons.push("อยู่ในงบ");
          } else if (activePrice <= needs.maxBudget * 1.15) {
            score += 18;
            reasons.push("เกินงบเล็กน้อย (ต่อรองได้)");
          } else if (activePrice > needs.maxBudget * 1.4) {
            return null; // Way over budget
          }
        }

        // 2) Zone / Location keyword match
        const searchable = [
          titleTh,
          titleEn,
          details.address_info?.district || "",
          details.address_info?.subdistrict || "",
          details.address_info?.popular_area || "",
          details.address_info?.province || "",
          descText.slice(0, 600),
        ]
          .join(" ")
          .toLowerCase();

        const matchedZones: string[] = [];
        for (const z of needs.zones) {
          if (searchable.includes(z.toLowerCase())) {
            matchedZones.push(z);
          }
        }
        if (matchedZones.length > 0) {
          score += Math.min(45, matchedZones.length * 25);
          reasons.push(`ตรงโซน (${matchedZones[0]})`);
        }

        // 3) Bedrooms match
        if (needs.bedrooms !== null && bedrooms !== null) {
          if (bedrooms === needs.bedrooms) {
            score += 20;
            reasons.push(`${bedrooms} ห้องนอนตรงสเปก`);
          } else if (Math.abs(bedrooms - needs.bedrooms) === 1) {
            score += 5;
          }
        }

        const rawImages = (Array.isArray(row.property_images) ? row.property_images : []) as Array<{
          image_url?: string | null;
          storage_path?: string | null;
          is_cover?: boolean | null;
          sort_order?: number | null;
        }>;
        const cover =
          rawImages.find((i) => i.is_cover) ||
          [...rawImages].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))[0];
        const coverImage =
          cover?.image_url && /^https?:\/\//i.test(cover.image_url)
            ? cover.image_url
            : cover?.storage_path
              ? getPublicImageUrl(cover.storage_path)
              : null;

        const slug = String(row.slug || details.meta_data?.slug || row.id);

        return {
          id: String(row.id),
          title: titleTh,
          propertyType,
          listingType,
          price: activePrice,
          bedrooms,
          sizeSqm,
          area: details.address_info?.popular_area || details.address_info?.district || "",
          coverImage,
          publicUrl: `${siteUrl}/properties/${slug}?src=fb_match`,
          score,
          reasons,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Build ready-to-paste Thai reply message pitching the top 1-3 matched rooms
    const firstName = body.authorName?.split(/\s+/)[0] || "";
    const greeting = firstName && firstName !== "ไม่ระบุชื่อ" ? `สวัสดีครับคุณ ${firstName}` : "สวัสดีครับ";
    const top3 = scored.slice(0, 3);
    const suggestedReply =
      top3.length > 0
        ? `${greeting} ผมมีห้องที่ตรงกับสเปกและงบที่หาอยู่พร้อมเข้าอยู่ครับ:\n\n` +
          top3
            .map((m, i) => {
              const priceStr = m.price
                ? needs.listingType === "SALE"
                  ? `${m.price.toLocaleString()} บาท`
                  : `${m.price.toLocaleString()} บาท/เดือน`
                : "สอบถามราคา";
              const spec = [
                m.bedrooms !== null ? `${m.bedrooms} นอน` : "",
                m.sizeSqm ? `${m.sizeSqm} ตร.ม.` : "",
              ]
                .filter(Boolean)
                .join(" ");
              return `${i + 1}. ${m.title}\n   💰 ${priceStr}${spec ? ` | 📐 ${spec}` : ""}\n   🔗 ดูรูปเพิ่ม: ${m.publicUrl}`;
            })
            .join("\n\n") +
          `\n\nสนใจห้องไหนทักแชทนัดชมห้องจริงได้เลยนะครับ 🙏`
        : `${greeting} สเปกนี้ผมกำลังเช็กห้องว่างโซนนี้ให้เพิ่มเติมครับ สะดวกคุยทางแชทหรือแอดไลน์ได้เลยนะครับ 🙏`;

    return NextResponse.json(
      {
        ok: true,
        needs,
        matches: scored,
        suggestedReply,
      },
      { headers: CORS_HEADERS },
    );
  } catch (err) {
    console.error("[MatchTenant] Error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Match failed" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
