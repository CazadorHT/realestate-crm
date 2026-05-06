import { NextResponse } from "next/server";
import { getTeamsAction } from "@/features/teams/actions/teamActions";

export async function GET() {
  try {
    const result = await getTeamsAction();
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    
    // Map to a simpler format for the dropdown
    const teams = (result.data || []).map(t => ({
      id: t.id,
      name: t.name
    }));

    return NextResponse.json({ data: teams });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}
