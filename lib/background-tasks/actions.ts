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
    };

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

