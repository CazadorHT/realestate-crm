import { NextRequest, NextResponse } from "next/server";
import { getFunnelStats } from "@/features/dashboard/queries/stats";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { getActiveTenantCookie } from "@/lib/actions/tenant-context";

interface ProfileWithTenant {
  tenant_id: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const profile = await getCurrentProfile() as ProfileWithTenant | null;
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "month";
    const view = (searchParams.get("view") as "company" | "team" | "branch" | "personal") || "company";
    const agentId = searchParams.get("agentId") || undefined;
    const branchId = searchParams.get("branchId");
    const teamId = searchParams.get("teamId");
    
    const tenantIdFromParam = searchParams.get("tenantId");
    const tenantIdFromCookie = await getActiveTenantCookie();
    const tenantId = (tenantIdFromParam && tenantIdFromParam !== "undefined") ? tenantIdFromParam : tenantIdFromCookie;

    const data = await getFunnelStats({ 
      tenantId, 
      range, 
      view, 
      agentId, 
      targetId: branchId || teamId 
    });
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error("API Funnel Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
