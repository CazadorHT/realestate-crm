"use server";

import { revalidatePath } from "next/cache";
import { requireAuthContext } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";
import { validateManagerRole, validateTeamName } from "../utils";

export type TeamWithManager = Tables<"teams"> & {
  manager?: {
    full_name: string | null;
  } | null;
  agent_count?: number;
};

/**
 * ดึงข้อมูลทีมทั้งหมด
 */
export async function getTeamsAction() {
  try {
    const ctx = await requireAuthContext();

    // ดึงข้อมูลทีมพร้อมข้อมูล Manager
    let query = ctx.supabase
      .from("teams")
      .select(
        `
        *,
        manager:profiles!teams_manager_id_fkey(full_name)
      `,
      );

    if (ctx.tenantId && ctx.tenantId !== "ALL") {
      query = query.eq("tenant_id", ctx.tenantId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error(
        "DEBUG: Error fetching teams:",
        JSON.stringify(error, null, 2),
      );
      return {
        success: false,
        message: "ไม่สามารถโหลดข้อมูลทีมได้ (Database Error)",
      };
    }

    if (!data || data.length === 0) {
      return { success: true, data: [], message: "ยังไม่มีข้อมูลทีมในระบบ" };
    }

    // Since we removed nested count to prevent query failure, we set agent_count to 0 for now
    // or we can fetch counts in a separate loop if needed, but for MVP let's get it working first.
    const formattedData = (data as any[]).map((team) => ({
      ...team,
      agent_count: 0, // Placeholder
    }));

    return { success: true, data: formattedData as TeamWithManager[] };
  } catch (error) {
    return { success: false, message: "Unauthorized" };
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
      .select()
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

    // 1) เคลียร์ team_id ใน profiles ก่อน (ถ้ามี)
    let profileQuery = ctx.supabase
      .from("profiles")
      .update({ team_id: null })
      .eq("team_id", id);

    // Note: Since profiles might not have tenant_id column, we rely on RLS 
    // or just the team_id match. But we should be careful.
    await profileQuery;

    // 2) ลบทีม
    let deleteQuery = ctx.supabase.from("teams").delete().eq("id", id);

    if (ctx.tenantId && ctx.tenantId !== "ALL") {
      deleteQuery = deleteQuery.eq("tenant_id", ctx.tenantId);
    }

    const { error } = await deleteQuery;

    if (error) {
      console.error("Error deleting team:", error);
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
