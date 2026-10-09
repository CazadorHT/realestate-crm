import { getPublicProperties } from "@/lib/services/properties";
import { createPublicClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

interface BlogContextMatch {
  properties: any[];
  contextTitleTh: string;
  contextTitleEn: string;
  contextTitleCn: string;
  contextTitleRu: string;
  matchedArea?: string;
  matchedType?: string;
}

/**
 * Fetches active popular areas for matching
 */
const getActiveAreasForBlogMatch = unstable_cache(
  async () => {
    try {
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("popular_areas_v3")
        .select("name, name_en, slug")
        .eq("is_active", true);
      return data || [];
    } catch {
      return [];
    }
  },
  ["blog-match-popular-areas"],
  { revalidate: 3600, tags: ["areas", "blog"] }
);

/**
 * Intelligently finds relevant real estate listings matching the blog post's topic,
 * area, or property type. Falls back to newest properties if no direct matches or insufficient count.
 */
export async function getBlogContextualProperties(
  post: {
    title?: string | null;
    tags?: string[] | string | null;
    category?: string | null;
    content?: string | null;
    excerpt?: string | null;
  },
  limit: number = 4
): Promise<BlogContextMatch> {
  // 1. Combine searchable tokens from blog
  const tagsStr = Array.isArray(post.tags) ? post.tags.join(" ") : post.tags || "";
  const combinedText = `${post.title || ""} ${tagsStr} ${post.category || ""} ${post.excerpt || ""}`.toLowerCase();

  // 2. Detect Area
  const activeAreas = await getActiveAreasForBlogMatch();
  let matchedArea: { name: string; name_en?: string } | undefined;

  for (const area of activeAreas) {
    const nameObj = typeof area.name === "object" && area.name !== null ? (area.name as any) : {};
    const rawThName = (typeof area.name === "string" ? area.name : nameObj.th || "") as string;
    const rawEnName = (typeof area.name_en === "string" ? area.name_en : nameObj.en || "") as string;

    const thName = (rawThName || "").trim().toLowerCase();
    const enName = (rawEnName || "").trim().toLowerCase();
    const rootTh = thName.replace(/(ภิเษก|นคร)$/, "");

    if (
      (thName && combinedText.includes(thName)) ||
      (rootTh.length >= 3 && combinedText.includes(rootTh)) ||
      (enName && enName.length >= 4 && combinedText.includes(enName))
    ) {
      matchedArea = {
        name: rawThName || thName,
        name_en: rawEnName || enName,
      };
      break;
    }
  }

  // 3. Detect Property Intent / Features
  const isOffice = /ออฟฟิศ|สำนักงาน|office|โฮมออฟฟิศ/i.test(combinedText);
  const isPetFriendly = /สัตว์เลี้ยง|pet-friendly|pet friendly|หมา|แมว/i.test(combinedText);
  const isLuxuryVilla = /พูลวิลล่า|วิลล่า|บ้านหรู|luxury villa|pool villa/i.test(combinedText);
  const isCbd = /cbd|ใจกลางเมือง|ทำเลทอง/i.test(combinedText);
  const isNearTransit = /รถไฟฟ้า|bts|mrt|สถานี/i.test(combinedText);
  const isCondo = /คอนโด|condo/i.test(combinedText) && !isOffice;
  const isHouse = /บ้านเดี่ยว|บ้านแฝด|house/i.test(combinedText) && !isLuxuryVilla;

  // 4. Build primary filter query options
  const filterOptions: Parameters<typeof getPublicProperties>[0] = {
    limit,
    sort: "NEWEST",
  };

  if (matchedArea) {
    filterOptions.area = matchedArea.name;
  }
  if (isOffice) {
    filterOptions.propertyType = "OFFICE_BUILDING";
  } else if (isLuxuryVilla) {
    filterOptions.luxuryVilla = true;
  } else if (isPetFriendly) {
    filterOptions.petFriendly = true;
  } else if (isCondo) {
    filterOptions.propertyType = "CONDO";
  } else if (isHouse) {
    filterOptions.propertyType = "HOUSE";
  }

  if (isCbd) filterOptions.cbd = true;
  if (isNearTransit) filterOptions.nearTrain = true;

  // 5. Query primary contextual properties
  let matchedProperties: any[] = [];
  try {
    const res = await getPublicProperties(filterOptions);
    matchedProperties = res.properties || [];
  } catch (err) {
    console.warn("Failed to fetch contextual properties for blog:", err);
  }

  // 6. If not enough results, backfill with newest listings to ensure reader always has listings
  if (matchedProperties.length < limit) {
    try {
      const existingIds = new Set(matchedProperties.map((p) => p.id));
      const fallbackRes = await getPublicProperties({ limit: limit + existingIds.size, sort: "NEWEST" });
      const fallbacks = (fallbackRes.properties || []).filter((p: any) => !existingIds.has(p.id));
      matchedProperties = [...matchedProperties, ...fallbacks].slice(0, limit);
    } catch (err) {
      console.warn("Failed to backfill fallback properties:", err);
    }
  }

  // 7. Dynamic contextual headline
  let contextTitleTh = "อสังหาริมทรัพย์แนะนำล่าสุด";
  let contextTitleEn = "Latest Featured Properties";
  let contextTitleCn = "最新推荐房产";
  let contextTitleRu = "Новые рекомендуемые объекты";

  if (matchedArea) {
    contextTitleTh = `อสังหาริมทรัพย์แนะนำในย่าน${matchedArea.name}`;
    contextTitleEn = `Featured Properties in ${matchedArea.name_en || matchedArea.name}`;
    contextTitleCn = `${matchedArea.name} 推荐房产`;
    contextTitleRu = `Недвижимость в районе ${matchedArea.name_en || matchedArea.name}`;
  } else if (isOffice) {
    contextTitleTh = "ออฟฟิศและพื้นที่สำนักงานให้เช่าแนะนำ";
    contextTitleEn = "Featured Offices & Workspaces for Rent";
    contextTitleCn = "精选写字楼与办公空间出租";
    contextTitleRu = "Рекомендуемые офисы в аренду";
  } else if (isPetFriendly) {
    contextTitleTh = "คอนโดและบ้านเลี้ยงสัตว์ได้ (Pet-Friendly) แนะนำ";
    contextTitleEn = "Featured Pet-Friendly Condos & Homes";
    contextTitleCn = "精选可养宠物公寓与住宅";
    contextTitleRu = "Недвижимость Pet-Friendly (можно с животными)";
  } else if (isLuxuryVilla) {
    contextTitleTh = "บ้านหรูและพูลวิลล่าระดับพรีเมียมแนะนำ";
    contextTitleEn = "Featured Luxury Villas & Premium Residences";
    contextTitleCn = "精选高端别墅与泳池别墅";
    contextTitleRu = "Элитные виллы и резиденции";
  }

  return {
    properties: matchedProperties,
    contextTitleTh,
    contextTitleEn,
    contextTitleCn,
    contextTitleRu,
    matchedArea: matchedArea?.name,
    matchedType: isOffice ? "OFFICE" : isPetFriendly ? "PET_FRIENDLY" : isLuxuryVilla ? "LUXURY_VILLA" : undefined,
  };
}
