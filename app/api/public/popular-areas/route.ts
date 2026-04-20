import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPopularAreasAction } from "@/features/public-data/popular-areas";
export const dynamic = 'force-dynamic'; // เพิ่มบรรทัดนี้
export const revalidate = 3600; // Cache for 1 hour
 
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    const requestedProvince = searchParams.get("province") || undefined;
 
    const client = await createClient();
 
    // 1) Handle "provinces" mode: Return list of all provinces with active properties
    if (mode === "provinces") {
      const { data: provinces, error: provErr } = await client
        .from("properties")
        .select("province")
        .eq("status", "ACTIVE")
        .not("province", "is", null);
 
      if (provErr) throw provErr;
 
      const uniqueThai = Array.from(new Set((provinces as { province: string }[]).map((p: { province: string }) => p.province).filter(Boolean)));
      
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
    // 2) Handle default mode: Fetch popular areas using the shared action
    const popularAreas = await getPopularAreasAction(requestedProvince);
    return NextResponse.json(popularAreas);
  } catch (e) {
    console.error("popular-areas route crash:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
