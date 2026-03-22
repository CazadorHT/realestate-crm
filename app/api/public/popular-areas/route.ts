import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AreaRow = {
  popular_area: string;
  popular_area_en: string | null;
  popular_area_cn: string | null;
  province: string;
  count: number;
  cover: string | null;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    const requestedProvince = searchParams.get("province"); // e.g., "Bangkok", "Phuket"

    const client = await createClient();

    // 1) Handle "provinces" mode: Return list of all provinces with active properties
    if (mode === "provinces") {
      const { data: provinces, error: provErr } = await client
        .from("properties")
        .select("province")
        .eq("status", "ACTIVE")
        .not("province", "is", null);

      if (provErr) throw provErr;

      // Extract unique Thai names and map to English display names
      const uniqueThai = Array.from(new Set(provinces.map((p) => p.province).filter(Boolean)));
      
      // Reverse map for display (Simplified)
      const displayMap: Record<string, string> = {
        "กรุงเทพมหานคร": "Bangkok",
        "ภูเก็ต": "Phuket",
        "เชียงใหม่": "Chiang Mai",
        "ชลบุรี": "Chonburi",
      };

      const result = uniqueThai.map(name => ({
        id: name,
        display: displayMap[name as string] || name
      }));

      return NextResponse.json(result);
    }

    // Map English keys to Thai DB values
    const provinceMap: Record<string, string[]> = {
      Bangkok: ["กรุงเทพมหานคร"],
      Phuket: ["ภูเก็ต", "Phuket"],
    };

    let query = client
      .from("properties")
      .select("id, popular_area, province, created_at")
      .eq("status", "ACTIVE");

    if (requestedProvince && provinceMap[requestedProvince]) {
      query = query.in("province", provinceMap[requestedProvince]);
    } else if (requestedProvince) {
      query = query.eq("province", requestedProvince);
    }

    const { data: props, error: propErr } = await query
      .order("created_at", { ascending: false })
      .limit(300);

    if (propErr) {
      console.error("popular-areas properties error:", propErr);
      return NextResponse.json({ error: "Failed" }, { status: 500 });
    }

    const properties = Array.isArray(props) ? props : [];
    const ids = properties.map((p: any) => p.id).filter(Boolean);

    // ถ้าไม่มีทรัพย์ ก็จบ
    if (ids.length === 0) return NextResponse.json([]);

    // 2) ดึงรูป cover ของทรัพย์เหล่านี้ (เฉพาะ is_cover = true ก่อน)
    const { data: covers, error: coverErr } = await client
      .from("property_images")
      .select("property_id, image_url, sort_order, is_cover")
      .in("property_id", ids)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true });

    if (coverErr) {
      console.error("popular-areas images error:", coverErr);
    }

    const coverByPropertyId = new Map<string, string>();
    for (const img of (covers ?? []) as any[]) {
      const pid = img?.property_id;
      const url = img?.image_url;
      if (!pid || !url) continue;

      if (!coverByPropertyId.has(pid)) coverByPropertyId.set(pid, url);
    }

    // 3) aggregate ตาม (popular_area + province)
    const map = new Map<string, AreaRow>();

    // 0) Fetch valid popular areas with translations (optionally filtered by province)
    let areasQuery = client
      .from("popular_areas")
      .select("name, name_en, name_cn, province");
    
    if (requestedProvince && provinceMap[requestedProvince]) {
      // Filter by any of the mapped names OR null (for legacy)
      const names = provinceMap[requestedProvince];
      areasQuery = areasQuery.or(`province.in.(${names.join(",")}),province.is.null`);
    } else if (requestedProvince) {
      areasQuery = areasQuery.or(`province.eq.${requestedProvince},province.is.null`);
    }

    const { data: validAreasData } = await areasQuery;

    // Create a map for quick lookup of translations
    const areaTranslations = new Map<
      string,
      { en: string | null; cn: string | null }
    >();
    (validAreasData || []).forEach((a: any) => {
      areaTranslations.set(a.name, { en: a.name_en, cn: a.name_cn });
    });

    const validAreaNames = new Set(areaTranslations.keys());

    for (const p of properties as any[]) {
      const area = (p?.popular_area ?? "").trim();
      const prov = (p?.province ?? "").trim();
      if (!area || !prov) continue;

      // Filter: Must be in valid popular_areas table if data exists
      if (validAreaNames.size > 0 && !validAreaNames.has(area)) {
        continue;
      }

      // Use only area as key to prevent duplicates (e.g., "บางนา กรุงเทพฯ" vs "บางนา สมุทรปราการ")
      const key = area;
      const cover = coverByPropertyId.get(p.id) ?? null;
      const trans = areaTranslations.get(area);

      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          popular_area: area,
          popular_area_en: trans?.en ?? null,
          popular_area_cn: trans?.cn ?? null,
          province: prov,
          count: 1,
          cover,
        });
      } else {
        existing.count += 1;
        // ถ้าการ์ดยังไม่มีรูป ให้ใช้รูปแรกที่หาได้
        if (!existing.cover && cover) existing.cover = cover;
      }
    }

    const result = Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return NextResponse.json(result);
  } catch (e) {
    console.error("popular-areas route crash:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
