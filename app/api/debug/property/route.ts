import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("properties")
      .select("id, slug, title, title_en, property_type, listing_type, price, rental_price, bedrooms, bathrooms, size_sqm, status, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message || error }, { status: 500 });
    }

    return NextResponse.json({ property: data || null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
