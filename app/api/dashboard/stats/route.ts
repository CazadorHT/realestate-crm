import { getDashboardStats } from "@/features/dashboard/queries/stats";
import { NextResponse } from "next/server";
import { getActiveTenantCookie } from "@/lib/actions/tenant-context";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "month";
  const agentId = searchParams.get("agentId");
  const viewParam = searchParams.get("view") || "company";
  const branchId = searchParams.get("branchId");
  const teamId = searchParams.get("teamId");
  
  const view = (["company", "team", "branch", "personal"].includes(viewParam) 
    ? viewParam 
    : "company") as "company" | "team" | "branch" | "personal";

  const tenantId = await getActiveTenantCookie();

  console.log("API Stats Request:", { tenantId, agentId, view, targetId: branchId || teamId, range });

  // Pass 5 arguments correctly as an object
  const stats = await getDashboardStats({
    tenantId, 
    agentId, 
    view, 
    targetId: branchId || teamId, 
    range
  });

  console.log("API Stats Output Leads:", stats.leadsTotal);

  return NextResponse.json({ data: stats });
}
