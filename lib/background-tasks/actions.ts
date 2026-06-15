"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthContext } from "@/lib/authz";
import { Database } from "@/lib/database.types";
import { getSystemConfig } from "@/lib/actions/system-config";

export type BackgroundTaskResult = {
  success: boolean;
  message?: string;
  data?: any;
};

/**
 * บันทึกงานใหม่ลงฐานข้อมูล
 */
export async function createBackgroundTaskAction(params: {
  id: string;
  name: string;
  type?: string;
  payload?: any;
  priority?: number;
}): Promise<BackgroundTaskResult> {
  try {
    const { tenantId, user } = await requireAuthContext();
    let finalTenantId = tenantId;
    if (!finalTenantId) {
      const config = await getSystemConfig();
      finalTenantId = config.default_tenant_id ?? undefined;
    }
    if (!finalTenantId) throw new Error("Tenant ID is required");

    const adminSupabase = createAdminClient();

    // 🕵️ DEDUPLICATION: ป้องกันการทำงานซ้ำ (Idempotency)
    // ค้นหางานที่ชื่อเหมือนกันและกำลังทำอยู่ในระบบ
    const { data: existingTasks } = await adminSupabase
      .from("system_task_queue")
      .select("id, status, payload")
      .eq("task_name", params.name)
      .eq("status", "PROCESSING")
      .limit(10);

    if (existingTasks && existingTasks.length > 0) {
      for (const task of existingTasks) {
        const payload = task.payload && typeof task.payload === "object" ? (task.payload as any) : {};
        if (
          payload.tenant_id === finalTenantId &&
          JSON.stringify(payload.client_payload) === JSON.stringify(params.payload)
        ) {
          console.log(`[BackgroundTask] Found duplicate task: ${params.name}. Skipping...`);
          return { success: true, data: task, message: "DUPLICATE_PREVENTED" };
        }
      }
    }

    const taskData = {
      id: params.id,
      task_name: params.name,
      priority: params.priority || 0,
      status: "PROCESSING",
      run_at: new Date().toISOString(),
      payload: {
        client_payload: params.payload || {},
        type: params.type,
        user_id: user.id,
        tenant_id: finalTenantId,
        message: "กำลังประมวลผล...",
      }
    };

    const { data, error } = await adminSupabase
      .from("system_task_queue")
      .insert(taskData)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error("createBackgroundTaskAction error:", error);
    return { success: false, message: error.message };
  }
}

/**
 * อัปเดตสถานะงาน
 */
export async function updateBackgroundTaskAction(params: {
  id: string;
  status: "SUCCESS" | "ERROR" | "PROCESSING";
  message?: string;
  result_link?: string;
  error_details?: string;
  is_cancelled?: boolean;
  result?: any;
}): Promise<BackgroundTaskResult> {
  try {
    const { tenantId, user, role } = await requireAuthContext();
    const adminSupabase = createAdminClient();

    // ดึง Payload เดิมมาผสาน
    const { data: currentTask } = await adminSupabase
      .from("system_task_queue")
      .select("payload")
      .eq("id", params.id)
      .single();

    const existingPayload = currentTask?.payload && typeof currentTask.payload === "object" ? (currentTask.payload as any) : {};

    const updatedPayload = {
      ...existingPayload,
      ...(params.result ? { result: params.result } : {}),
      ...(params.result_link ? { result_link: params.result_link } : {}),
      ...(params.message ? { message: params.message } : {}),
      ...(params.error_details ? { error_details: params.error_details } : {}),
      ...(params.is_cancelled !== undefined ? { is_cancelled: params.is_cancelled } : {}),
    };

    const updateData: any = {
      status: params.status,
      error_log: params.error_details || params.message || null,
      payload: updatedPayload,
    };

    if (params.status === "SUCCESS" || params.status === "ERROR") {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await adminSupabase
      .from("system_task_queue")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error("updateBackgroundTaskAction error:", error);
    return { success: false, message: error.message };
  }
}

/**
 * ดึงรายการงานย้อนหลัง
 */
export async function getBackgroundTasksAction(): Promise<BackgroundTaskResult> {
  try {
    const { tenantId, user, role } = await requireAuthContext();
    const adminSupabase = createAdminClient();

    let query = adminSupabase.from("system_task_queue").select("*");

    const { data, error } = await query
      .order("run_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    // TEMPORARY: Return unfiltered data to inspect tasks in the browser console
    const filteredData = (data || []).map((task: any) => {
      const payload = task.payload && typeof task.payload === "object" ? (task.payload as any) : {};
      return {
        id: task.id,
        name: task.task_name,
        status: task.status,
        message: payload.message || task.error_log || "",
        created_at: task.run_at,
        completed_at: task.completed_at,
        type: payload.type,
        payload: payload.client_payload,
        result_link: payload.result_link,
        error_details: task.error_log || payload.error_details,
        result: payload.result,
        raw_payload: payload // Include raw payload for debugging
      };
    });

    return { success: true, data: filteredData };
  } catch (error: any) {
    console.error("getBackgroundTasksAction error:", error);
    return { success: false, message: error.message };
  }
}

/**
 * ยกเลิกการทำงาน
 */
export async function cancelBackgroundTaskAction(id: string): Promise<BackgroundTaskResult> {
  try {
    const { tenantId, user, role } = await requireAuthContext();
    const adminSupabase = createAdminClient();

    // ดึงข้อมูลปัจจุบันเพื่อเช็คสิทธิ์ก่อนยกเลิก
    const { data: currentTask, error: fetchError } = await adminSupabase
      .from("system_task_queue")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchError || !currentTask) {
      console.warn(`[BackgroundTask] cancel: Task ${id} not found in database. Treating as success for client to clear.`);
      return { success: true, message: "Task not found in DB, cleared locally" };
    }

    const payload = currentTask.payload && typeof currentTask.payload === "object" ? (currentTask.payload as any) : {};
    
    // ตรวจสอบความปลอดภัย
    if (role !== "ADMIN") {
      if (tenantId && payload.tenant_id !== tenantId) {
        throw new Error("Unauthorized tenant access");
      }
      if (!tenantId && payload.user_id !== user.id) {
        throw new Error("Unauthorized user access");
      }
    }

    const updatedPayload = {
      ...payload,
      is_cancelled: true,
      message: "ยกเลิกการทำงานโดยผู้ใช้"
    };

    const { data, error } = await adminSupabase
      .from("system_task_queue")
      .update({ 
        status: "ERROR", // หรือ "CANCELLED"
        error_log: "ยกเลิกการทำงานโดยผู้ใช้",
        completed_at: new Date().toISOString(),
        payload: updatedPayload
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error("cancelBackgroundTaskAction error:", error);
    return { success: false, message: error.message };
  }
}

/**
 * ล้างข้อมูลงานที่เสร็จสิ้นหรือผิดพลาดออกจากฐานข้อมูล
 */
export async function pruneBackgroundTasksAction(): Promise<BackgroundTaskResult> {
  try {
    const { tenantId, user, role } = await requireAuthContext();
    const adminSupabase = createAdminClient();

    // ดึงงานที่ต้องการประเมินก่อนลบ เพื่อทำ Application-level filter
    const { data, error: fetchError } = await adminSupabase
      .from("system_task_queue")
      .select("id, payload")
      .in("status", ["SUCCESS", "ERROR", "completed", "failed"]);

    if (fetchError) throw fetchError;

    const idsToDelete = (data || []).filter((task: any) => {
      const payload = task.payload && typeof task.payload === "object" ? (task.payload as any) : {};
      if (role === "ADMIN") return true;
      if (tenantId) return payload.tenant_id === tenantId;
      return payload.user_id === user.id;
    }).map((task: any) => task.id);

    if (idsToDelete.length > 0) {
      const { error } = await adminSupabase
        .from("system_task_queue")
        .delete()
        .in("id", idsToDelete);
      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error("pruneBackgroundTasksAction error:", error);
    return { success: false, message: error.message };
  }
}

/**
 * ล้างข้อมูลงานที่ระบุออกจากฐานข้อมูล (Bulk Delete)
 */
export async function deleteBackgroundTasksAction(ids: string[]): Promise<BackgroundTaskResult> {
  try {
    const { tenantId, user, role } = await requireAuthContext();
    const adminSupabase = createAdminClient();

    // ดึงงานเพื่อตรวจสอบสิทธิ์
    const { data, error: fetchError } = await adminSupabase
      .from("system_task_queue")
      .select("id, payload")
      .in("id", ids);

    if (fetchError) throw fetchError;

    const idsToDelete = (data || []).filter((task: any) => {
      const payload = task.payload && typeof task.payload === "object" ? (task.payload as any) : {};
      if (role === "ADMIN") return true;
      if (tenantId) return payload.tenant_id === tenantId;
      return payload.user_id === user.id;
    }).map((task: any) => task.id);

    if (idsToDelete.length > 0) {
      const { error } = await adminSupabase
        .from("system_task_queue")
        .delete()
        .in("id", idsToDelete);
      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error("deleteBackgroundTasksAction error:", error);
    return { success: false, message: error.message };
  }
}

/**
 * ล้างข้อมูลงานที่เก่ากว่า 7 วัน (Auto Cleanup)
 */
export async function autoPruneOldTasksAction(): Promise<BackgroundTaskResult> {
  try {
    const adminSupabase = createAdminClient();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { error } = await adminSupabase
      .from("system_task_queue")
      .delete()
      .lt("run_at", sevenDaysAgo.toISOString());

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * ตรวจสอบและล้างงานที่ค้าง (Stuck Tasks) ที่ค้างอยู่นานกว่า 2 ชั่วโมง
 */
export async function markStuckTasksAsErrorAction(): Promise<BackgroundTaskResult> {
  try {
    const adminSupabase = createAdminClient();

    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    const { data: stuckTasks, error: fetchError } = await adminSupabase
      .from("system_task_queue")
      .select("id, payload")
      .eq("status", "PROCESSING")
      .lt("run_at", twoHoursAgo.toISOString());

    if (fetchError) throw fetchError;

    if (stuckTasks && stuckTasks.length > 0) {
      for (const task of stuckTasks) {
        const payload = task.payload && typeof task.payload === "object" ? (task.payload as any) : {};
        const updatedPayload = {
          ...payload,
          message: "งานถูกระงับเนื่องจากใช้เวลานานเกินกำหนด (Timeout)"
        };

        await adminSupabase
          .from("system_task_queue")
          .update({
            status: "ERROR",
            error_log: "Timeout",
            completed_at: new Date().toISOString(),
            payload: updatedPayload
          })
          .eq("id", task.id);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("markStuckTasksAsErrorAction error:", error);
    return { success: false, message: error.message };
  }
}
