"use server";

import { createClient } from "@/lib/supabase/server";

export interface FilterOptions {
  branches: { id: string; name: string }[];
  teams: { id: string; name: string; tenant_id: string | null }[];
  agents: { id: string; full_name: string | null; team_id: string | null; tenant_id: string | null }[];
}

export async function getFilterOptionsAction(): Promise<FilterOptions> {
  const supabase = await createClient();

  const [branchesRes, teamsRes, agentsRes] = await Promise.all([
    supabase.from("tenants").select("id, name").is("is_deleted", false),
    supabase.from("teams").select("id, name, tenant_id"),
    supabase.from("profiles").select(`
      id, 
      full_name, 
      team_id,
      team:teams(tenant_id)
    `),
  ]);

  return {
    branches: (branchesRes.data || []) as { id: string; name: string }[],
    teams: (teamsRes.data || []) as { id: string; name: string; tenant_id: string | null }[],
    agents: (agentsRes.data || []).map((a: any) => ({
      id: a.id,
      full_name: a.full_name,
      team_id: a.team_id,
      tenant_id: a.team?.tenant_id || null
    })),
  };
}
