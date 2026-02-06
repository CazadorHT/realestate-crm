import { NextResponse } from "next/server";
import { getSiteSetting } from "@/features/site-settings/actions";

export async function GET() {
  try {
    const enabled = await getSiteSetting("smart_match_wizard_enabled");
    return NextResponse.json({ enabled });
  } catch (error) {
    // Default to enabled if error
    return NextResponse.json({ enabled: true });
  }
}
