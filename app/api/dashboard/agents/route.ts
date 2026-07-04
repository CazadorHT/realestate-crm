import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenantCookie } from "@/lib/actions/tenant-context";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");
    
    const tenantIdFromParam = searchParams.get("tenantId");
    const tenantIdFromCookie = await getActiveTenantCookie();
    const tenantId = (tenantIdFromParam && tenantIdFromParam !== "undefined") ? tenantIdFromParam : tenantIdFromCookie;

    // 1. Fetch member ids from tenant_members_v3
    let memberQuery = supabase
      .from("tenant_members_v3")
      .select("identity_id, team_id");
    
    if (tenantId) {
      memberQuery = memberQuery.eq("tenant_id", tenantId);
    }
    if (teamId && teamId !== "ALL" && teamId !== "undefined") {
      memberQuery = memberQuery.eq("team_id", teamId);
    }

    const { data: members, error: membersError } = await memberQuery;
    if (membersError) {
      console.error("API Fetch Members Error:", membersError);
      return NextResponse.json({ error: "Failed to fetch tenant members" }, { status: 400 });
    }

    const ids = (members || []).map((m: any) => m.identity_id);
    if (ids.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 2. Fetch profiles for those members
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, display_name, avatar_url")
      .in("id", ids)
      .eq("is_active", true)
      .is("deleted_at", null);

    if (profilesError) {
      console.error("API Fetch Profiles Error:", profilesError);
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 400 });
    }

    const data = (profiles || []).map((p: any) => ({
      id: p.id,
      name: p.display_name || p.full_name || "Unnamed Agent",
      avatar_url: p.avatar_url
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("API Agents Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
