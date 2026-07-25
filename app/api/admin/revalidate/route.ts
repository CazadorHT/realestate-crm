import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refreshProjectStatsView } from "@/features/properties/actions/refresh-stats";

export async function POST() {
  try {
    const supabase = await createClient();
    await refreshProjectStatsView(supabase);
    return NextResponse.json({ success: true, message: "Cache purged and view refreshed successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    await refreshProjectStatsView(supabase);
    return NextResponse.json({ success: true, message: "Cache purged and view refreshed successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
