import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("property_images")
      .select("property_id, image_url, storage_path, is_cover")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("debug/property-image-sample supabase error:", error);
      return NextResponse.json({ error: error.message || error }, { status: 500 });
    }

    return NextResponse.json({ sample: data || [] });
  } catch (e: any) {
    console.error("debug/property-image-sample exception:", e);
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
