"use server";

import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/database.types.generated";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface FilterOptions {
  branches: { id: string; name: string }[];
  teams: { id: string; name: string; tenant_id: string | null }[];
  agents: { id: string; full_name: string | null; team_id: string | null; tenant_id: string | null }[];
}

export async function getFilterOptionsAction(): Promise<FilterOptions> {
  const supabase = await createClient();

  const [branchesRes, teamsRes, agentsRes] = await Promise.all([
    supabase.from("tenants_v3").select("id, name"),
    supabase.from("teams_v3").select("id, name, tenant_id"),
    supabase.from("tenant_members_v3").select(`
      id,
      team_id,
      tenant_id,
      agent:identities_v3!identity_id(
        id,
        display_name
      )
    `),
  ]);

  interface AgentJoinResult {
    id: string;
    team_id: string | null;
    tenant_id: string | null;
    agent: {
      id: string;
      display_name: string | null;
    } | null;
  }

  return {
    branches: (branchesRes.data || []) as { id: string; name: string }[],
    teams: (teamsRes.data || []) as { id: string; name: string; tenant_id: string | null }[],
    agents: ((agentsRes.data as unknown as AgentJoinResult[]) || []).map((row) => {
      return {
        id: row.agent?.id || row.id,
        full_name: row.agent?.display_name || "Unknown Agent",
        team_id: row.team_id,
        tenant_id: row.tenant_id
      };
    }),
  };
}
