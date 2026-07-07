import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("property_images")
      .select("image_url, storage_path, is_cover")
      .eq("property_id", id)
      .order("is_cover", { ascending: false })
      .limit(10);

    if (error) {
      console.error("debug/property-image supabase error:", error);
      return NextResponse.json({ error: error.message || error }, { status: 500 });
    }

    return NextResponse.json({ images: data || [] });
  } catch (e: any) {
    console.error("debug/property-image exception:", e);
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
