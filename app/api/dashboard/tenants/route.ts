import { NextResponse } from "next/server";
import { getTenantsAction } from "@/lib/actions/tenant-management";

export async function GET() {
  try {
    const result = await getTenantsAction();
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    // Map to a simpler format for the dropdown
    const branches = (result.data || []).map(b => ({
      id: b.id,
      name: b.name
    }));

    return NextResponse.json({ data: branches });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 });
  }
}
