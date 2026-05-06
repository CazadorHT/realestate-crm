import { NextResponse } from "next/server";
import { getTopAgents } from "@/features/dashboard/queries/performance";
import { getActiveTenantCookie } from "@/lib/actions/tenant-context";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "month";
    const teamId = searchParams.get("teamId");
    
    const tenantIdFromParam = searchParams.get("tenantId");
    const tenantIdFromCookie = await getActiveTenantCookie();
    const tenantId = (tenantIdFromParam && tenantIdFromParam !== "undefined") ? tenantIdFromParam : tenantIdFromCookie;

    const data = await getTopAgents({ 
      tenantId, 
      range, 
      teamId: teamId === "ALL" ? undefined : (teamId || undefined) 
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("API Agents Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
