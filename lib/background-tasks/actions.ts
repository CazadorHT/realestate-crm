"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext } from "@/lib/authz";
import { Database } from "@/lib/database.types";

export type BackgroundTaskResult = {
  success: boolean;
  message?: string;
  data?: any;
};

type BackgroundTaskInsert = Database["public"]["Tables"]["background_tasks"]["Insert"];
type BackgroundTaskUpdate = Database["public"]["Tables"]["background_tasks"]["Update"];

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
    const { supabase, user, tenantId } = await requireAuthContext();
    if (!tenantId) throw new Error("Tenant ID is required");

    // 🕵️ DEDUPLICATION: ป้องกันการทำงานซ้ำ (Idempotency)
    // หากมีงานชื่อเดียวกัน และ Payload เดียวกันที่กำลังรันอยู่ ให้ใช้ของเดิม
    const { data: existingTasks } = await supabase
      .from("background_tasks")
      .select("id, status")
      .eq("tenant_id", tenantId)
      .eq("name", params.name)
      .eq("status", "PROCESSING")
      .limit(1);

    if (existingTasks && existingTasks.length > 0) {
      // ตรวจสอบ payload เชิงลึก (เทียบ JSON string)
      const { data: fullTask } = await supabase
        .from("background_tasks")
        .select("*")
        .eq("id", existingTasks[0].id)
        .single();
      
      if (fullTask && JSON.stringify((fullTask as any).payload) === JSON.stringify(params.payload)) {
        console.log(`[BackgroundTask] Found duplicate task: ${params.name}. Skipping...`);
        return { success: true, data: fullTask, message: "DUPLICATE_PREVENTED" };
      }
    }

    const taskData: BackgroundTaskInsert = {
      id: params.id,
      name: params.name,
      type: params.type,
      payload: params.payload,
      status: "PROCESSING",
      user_id: user.id,
      tenant_id: tenantId,
      priority: params.priority || 0,
    };

    const { data, error } = await supabase
      .from("background_tasks")
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
    const { supabase, tenantId } = await requireAuthContext();
    if (!tenantId) throw new Error("Tenant ID is required");

    const updateData: BackgroundTaskUpdate = {
      status: params.status,
      message: params.message,
      result_link: params.result_link,
      error_details: params.error_details,
      is_cancelled: params.is_cancelled,
      result: params.result, // 👈 ส่งเข้าฐานข้อมูล (ต้องมั่นใจว่าตารางมีคอลัมน์นี้)
    } as any;

    const { data, error } = await supabase
      .from("background_tasks")
      .update(updateData)
      .eq("id", params.id)
      .eq("tenant_id", tenantId)
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
    const { supabase, tenantId } = await requireAuthContext();
    if (!tenantId) throw new Error("Tenant ID is required");

    const { data, error } = await supabase
      .from("background_tasks")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return { success: true, data };
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
    const { supabase, tenantId } = await requireAuthContext();
    if (!tenantId) throw new Error("Tenant ID is required");

    const { data, error } = await supabase
      .from("background_tasks")
      .update({ 
        is_cancelled: true,
        status: "ERROR",
        message: "ยกเลิกโดยผู้ใช้"
      })
      .eq("id", id)
      .eq("tenant_id", tenantId)
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
    const { supabase, tenantId } = await requireAuthContext();
    if (!tenantId) throw new Error("Tenant ID is required");

    const { error } = await supabase
      .from("background_tasks")
      .delete()
      .eq("tenant_id", tenantId)
      .in("status", ["SUCCESS", "ERROR"]);

    if (error) throw error;

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
    const { supabase, tenantId } = await requireAuthContext();
    if (!tenantId) throw new Error("Tenant ID is required");

    const { error } = await supabase
      .from("background_tasks")
      .delete()
      .eq("tenant_id", tenantId)
      .in("id", ids);

    if (error) throw error;

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
    const { supabase, tenantId } = await requireAuthContext();
    if (!tenantId) throw new Error("Tenant ID is required");

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { error } = await supabase
      .from("background_tasks")
      .delete()
      .eq("tenant_id", tenantId)
      .lt("created_at", sevenDaysAgo.toISOString());

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
    const { supabase, tenantId } = await requireAuthContext();
    if (!tenantId) throw new Error("Tenant ID is required");

    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    const { error } = await supabase
      .from("background_tasks")
      .update({ 
        status: "ERROR", 
        message: "งานถูกระงับเนื่องจากใช้เวลานานเกินกำหนด (Timeout)" 
      })
      .eq("tenant_id", tenantId)
      .eq("status", "PROCESSING")
      .lt("created_at", twoHoursAgo.toISOString());

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("markStuckTasksAsErrorAction error:", error);
    return { success: false, message: error.message };
  }
}
