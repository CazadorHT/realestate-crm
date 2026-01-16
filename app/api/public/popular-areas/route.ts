import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AreaRow = {
  popular_area: string;
  province: string;
  count: number;
  cover: string | null;
};

export async function GET() {
  try {
    const supabase = await createClient();

    // 1) ดึงทรัพย์ ACTIVE พร้อม fields ที่ใช้สรุปทำเล
    const { data: props, error: propErr } = await supabase
      .from("properties")
      .select("id, popular_area, province, created_at")
      .eq("status", "ACTIVE")
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
    const { data: covers, error: coverErr } = await supabase
      .from("property_images")
      .select("property_id, image_url, sort_order, is_cover")
      .in("property_id", ids)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true });

    if (coverErr) {
      // ถ้ารูปโดน RLS บล็อก จะได้ error ตรงนี้ → อย่างน้อยยังส่งทำเลได้แต่ไม่มีรูป
      console.error("popular-areas images error:", coverErr);
    }

    const coverByPropertyId = new Map<string, string>();
    for (const img of (covers ?? []) as any[]) {
      const pid = img?.property_id;
      const url = img?.image_url;
      if (!pid || !url) continue;

      // เอารูปแรกที่เจอจากลำดับที่ order ไว้ (cover ก่อน)
      if (!coverByPropertyId.has(pid)) coverByPropertyId.set(pid, url);
    }

    // 3) aggregate ตาม (popular_area + province)
    const map = new Map<string, AreaRow>();

    // 0) Fetch valid popular areas
    const { data: validAreasData } = await supabase
      .from("popular_areas")
      .select("name");
    const validAreaNames = new Set(
      (validAreasData || []).map((a: any) => a.name)
    );

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

      const existing = map.get(key);
      if (!existing) {
        map.set(key, { popular_area: area, province: prov, count: 1, cover });
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
