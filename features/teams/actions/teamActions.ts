"use server";

import { revalidatePath } from "next/cache";
import { requireAuthContext } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";
import { validateManagerRole, validateTeamName } from "../utils";


export type TeamWithManager = Tables<"teams"> & {
  manager?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  agent_count?: number;
  member_previews?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  }[];
};

/**
 * ดึงข้อมูลทีมทั้งหมด
 */
export async function getTeamsAction() {
  try {
    const ctx = await requireAuthContext();
    const tId = ctx.tenantId;

    // Use safe user client from context to respect RLS
    const { supabase } = ctx;

    let query = supabase
      .from("teams")
      .select(`
        id,
        name,
        created_at,
        tenant_id,
        manager_id,
        manager:profiles!teams_manager_id_fkey (
          full_name, 
          avatar_url
        ),
        members:profiles!profiles_team_id_fkey (
          id, 
          full_name, 
          avatar_url
        )
      `);

    if (tId && tId !== "ALL") {
      query = query.eq("tenant_id", tId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    // --- Diagnostic Logs ---
    console.log(`[getTeamsAction] TenantID: ${tId}, Success: ${!error}, DataCount: ${data?.length || 0}`);

    if (error) {
      console.error("TRACE [getTeamsAction]:", JSON.stringify(error, null, 2));
      return { 
        success: false, 
        message: "ระบบไม่สามารถดึงข้อมูลรายชื่อทีมได้ในขณะนี้",
        error: error.message 
      };
    }

    type TeamQueryResult = {
      id: string;
      name: string;
      created_at: string;
      tenant_id: string | null;
      manager_id: string | null;
      manager: { full_name: string | null; avatar_url: string | null } | null;
      members: { id: string; full_name: string | null; avatar_url: string | null }[];
    };

    const formattedData: TeamWithManager[] = (data as unknown as TeamQueryResult[]).map((team) => ({
      ...team,
      agent_count: team.members?.length || 0,
      member_previews: team.members?.slice(0, 5) || [],
    }));

    return { success: true, data: formattedData };
  } catch (error) {
    console.error("CRITICAL [getTeamsAction]:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์" };
  }
}

/**
 * ดึงสถิติรวมสำหรับ Dashboard จัดการทีม (Scoped by Tenant)
 */
export async function getTeamManagementStatsAction() {
  try {
    const ctx = await requireAuthContext();
    const tId = ctx.tenantId;
    const { supabase } = ctx;

    // 1. จำนวนทีม
    let teamsQuery = supabase.from("teams").select("id", { count: "exact", head: true });
    if (tId && tId !== "ALL") teamsQuery = teamsQuery.eq("tenant_id", tId);
    const { count: teamCount } = await teamsQuery;

    // 2. จำนวนเอเจนท์ที่มีสังกัดทีม (ในสาขานี้)
    let agentsQuery = supabase.from("profiles").select("id", { count: "exact", head: true }).not("team_id", "is", null);
    if (tId && tId !== "ALL") {
        const { data: branchTeams } = await supabase.from("teams").select("id").eq("tenant_id", tId);
        const teamIds = branchTeams?.map(t => t.id) || [];
        agentsQuery = agentsQuery.in("team_id", teamIds);
    }
    const { count: agentCount } = await agentsQuery;

    // 3. จำนวน Lead ในระบบ (Scoped)
    let leadsQuery = supabase.from("leads").select("id", { count: "exact", head: true });
    if (tId && tId !== "ALL") leadsQuery = leadsQuery.eq("tenant_id", tId);
    const { count: leadCount } = await leadsQuery;

    return {
      success: true,
      data: {
        totalTeams: teamCount || 0,
        totalAgents: agentCount || 0,
        totalLeads: leadCount || 0
      }
    };
  } catch (err) {
    return { success: false, message: "Failed to fetch stats" };
  }
}

/**
 * ดึงสมาชิกในทีมพร้อมข้อมูลสถิติ
 */
export async function getTeamMembersAction(teamId: string) {
  try {
    const ctx = await requireAuthContext();
    const { supabase } = ctx;

    // 0. ดึงข้อมูลทีมเพื่อหา Manager ID
    const { data: teamInfo } = await supabase
      .from("teams")
      .select("manager_id")
      .eq("id", teamId)
      .single();

    const leaderId = teamInfo?.manager_id;

    // 1. ดึงรายชื่อสมาชิกในทีม (Profiles where team_id = teamId) 
    // และรวมตัวหัวหน้าทีมเข้าไปด้วย (Profiles where id = leaderId)
    const query = supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        role,
        avatar_url
      `);
    
    // ใช้ OR เพื่อดึงทั้งสมาชิกปกติ และตัวหัวหน้าทีม
    if (leaderId) {
      query.or(`team_id.eq.${teamId},id.eq.${leaderId}`);
    } else {
      query.eq("team_id", teamId);
    }

    const { data: profiles, error: pError } = await query.order("full_name");

    if (pError) {
      console.error("TRACE [getTeamMembersAction] Profile Error:", pError);
      return { success: false, message: "ไม่สามารถโหลดรายชื่อสมาชิกได้" };
    }

    if (!profiles || profiles.length === 0) {
      return { success: true, data: [] };
    }

    // 2. ดึงจำนวน Lead ที่แต่ละคนถือครอง (ใช้ Promise.all เพื่อความเร็ว)
    const formatted = await Promise.all(profiles.map(async (profile) => {
      const { count } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to", profile.id);
      
      return {
        ...profile,
        lead_count: count || 0,
        isLeader: profile.id === leaderId
      };
    }));

    console.log(`[getTeamMembersAction] Success, Members: ${formatted.length}`);
    return { success: true, data: formatted };
  } catch (error) {
    return { success: false, message: "Server error fetching members" };
  }
}

/**
 * ถอดหรือย้ายสมาชิกทีม
 */
export async function updateUserTeamAction(
  userId: string,
  teamId: string | null,
) {
  try {
    const ctx = await requireAuthContext();
    const { supabase } = ctx;

    // 1) ต้องเป็น ADMIN เท่านั้นที่จัดการทีมได้ (อ้างอิงจาก UserRole type)
    if (ctx.role !== "ADMIN") {
      return { success: false, message: "ไม่มีสิทธิ์ในการดำเนินการนี้" };
    }

    // 2) ตรวจสอบว่าทีมมีอยู่จริง (ในกรณีที่ย้ายเข้าทีม)
    if (teamId) {
      const { data: team } = await supabase
        .from("teams")
        .select("id")
        .eq("id", teamId)
        .maybeSingle();

      if (!team) return { success: false, message: "ไม่พบทีมที่ระบุ" };
    }

    // 3) อัปเดตข้อมูลผ่าน Safe Client (RLS Protected)
    const { error } = await supabase
      .from("profiles")
      .update({ team_id: teamId })
      .eq("id", userId);

    if (error) {
      console.error("TRACE [updateUserTeamAction]:", error);
      return { success: false, message: "เกิดข้อผิดพลาดในการอัปเดตทีม" };
    }

    revalidatePath("/protected/settings/teams");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Unauthorized or Server Error" };
  }
}


/**
 * สร้างทีมใหม่
 */
export async function createTeamAction(name: string, managerId?: string) {
  try {
    const ctx = await requireAuthContext();

    if (ctx.role !== "ADMIN") {
      return { success: false, message: "ไม่มีสิทธิ์ในการดำเนินการนี้" };
    }

    const nameVal = validateTeamName(name);
    if (!nameVal.valid) return { success: false, message: nameVal.message };
    const trimmedName = nameVal.name!;

    // 1) ตรวจสอบชื่อทีมซ้ำ
    const { data: existingTeam } = await ctx.supabase
      .from("teams")
      .select("id")
      .eq("name", trimmedName)
      .maybeSingle();

    if (existingTeam) {
      return { success: false, message: "ชื่อทีมนี้มีอยู่ในระบบแล้ว" };
    }

    // 2) ตรวจสอบสิทธิ์ของ Manager (ถ้ามีการระบุ)
    if (managerId) {
      const { data: managerProfile } = await ctx.supabase
        .from("profiles")
        .select("role")
        .eq("id", managerId)
        .single();

      const roleVal = validateManagerRole(managerProfile?.role);
      if (!roleVal.valid) return { success: false, message: roleVal.message };
    }

    const { data, error } = await ctx.supabase
      .from("teams")
      .insert({
        name,
        manager_id: managerId || null,
        tenant_id: ctx.tenantId && ctx.tenantId !== "ALL" ? ctx.tenantId : null,
      })
      .select("id, name, created_at, manager_id, tenant_id")
      .single();

    if (error) {
      console.error("Error creating team:", error);
      return { success: false, message: "ไม่สามารถสร้างทีมได้" };
    }

    await logAudit(ctx, {
      action: "team.create",
      entity: "teams",
      entityId: data.id,
      metadata: { name, managerId },
    });

    revalidatePath("/protected/settings/teams");
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Unauthorized" };
  }
}

/**
 * อัปเดตข้อมูลทีม
 */
export async function updateTeamAction(
  id: string,
  updates: TablesUpdate<"teams">,
) {
  try {
    const ctx = await requireAuthContext();

    if (ctx.role !== "ADMIN") {
      return { success: false, message: "ไม่มีสิทธิ์ในการดำเนินการนี้" };
    }

    if (updates.name !== undefined) {
      const trimmedName = updates.name.trim();
      if (!trimmedName) return { success: false, message: "กรุณาระบุชื่อทีม" };

      // ตรวจสอบชื่อซ้ำ (ยกเว้นตัวเอง)
      const { data: existing } = await ctx.supabase
        .from("teams")
        .select("id")
        .eq("name", trimmedName)
        .neq("id", id)
        .maybeSingle();

      if (existing)
        return { success: false, message: "ชื่อทีมนี้มีอยู่ในระบบแล้ว" };
      updates.name = trimmedName;
    }

    if (updates.manager_id) {
      const { data: managerProfile } = await ctx.supabase
        .from("profiles")
        .select("role")
        .eq("id", updates.manager_id)
        .single();

      if (
        !managerProfile ||
        (managerProfile.role !== "ADMIN" && managerProfile.role !== "MANAGER")
      ) {
        return {
          success: false,
          message: "ผู้ที่ถูกเลือกต้องมีบทบาท ADMIN หรือ MANAGER เท่านั้น",
        };
      }
    }

    let query = ctx.supabase
      .from("teams")
      .update(updates)
      .eq("id", id);

    if (ctx.tenantId && ctx.tenantId !== "ALL") {
      query = query.eq("tenant_id", ctx.tenantId);
    }

    const { error } = await query;

    if (error) {
      console.error("Error updating team:", error);
      return { success: false, message: "ไม่สามารถอัปเดตข้อมูลทีมได้" };
    }

    await logAudit(ctx, {
      action: "team.update",
      entity: "teams",
      entityId: id,
      metadata: updates,
    });

    revalidatePath("/protected/settings/teams");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Unauthorized" };
  }
}

/**
 * ลบทีม
 */
export async function deleteTeamAction(id: string) {
  try {
    const ctx = await requireAuthContext();

    if (ctx.role !== "ADMIN") {
      return { success: false, message: "ไม่มีสิทธิ์ในการดำเนินการนี้" };
    }

    // 🛡️ [PHASE 1] Use Security Definer RPC for atomic team deletion
    const { error } = await ctx.supabase.rpc("hard_delete_team", {
      p_team_id: id
    });

    if (error) {
      console.error("Error deleting team via RPC:", error);
      return { success: false, message: "ไม่สามารถลบทีมได้" };
    }

    await logAudit(ctx, {
      action: "team.delete",
      entity: "teams",
      entityId: id,
    });

    revalidatePath("/protected/settings/teams");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Unauthorized" };
  }
}
