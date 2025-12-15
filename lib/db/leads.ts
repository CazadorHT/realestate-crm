import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import type { LeadFormValues } from "@/lib/validations/lead";
import { LeadUpdate } from "@/types/db";

export type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

/**
 * ดึง leads ทั้งหมด เรียงตาม `created_at` (ใหม่ -> เก่า)
 * Returns an empty array on success or throws on unexpected errors.
 */
export async function getAllLeads(): Promise<LeadRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  // ถ้ามี error จริง ๆ ให้โยนออกไป เพื่อให้ caller จัดการ (หรือจับได้ในการเรียก)
  if (error) throw new Error(`getAllLeads failed: ${error.message}`);

  // `data` อาจเป็น null ถ้าไม่มีแถว เลยส่งกลับเป็น array ว่าง
  return (data ?? []) as LeadRow[];
}

/**
 * ดึง lead ตาม `id` คืนค่า `LeadRow` หรือ `null` เมื่อไม่พบ
 * Supabase จะส่ง error code `PGRST116` เมื่อ `.single()` ไม่พบแถว — เราตรวจและคืน `null` ในกรณีนี้
 */
export async function getLeadById(id: string): Promise<LeadRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("leads").select("*").eq("id", id).single();

  if (error) {
    // safety: บางเวอร์ชันของ error อาจไม่มี `code` property ดังนั้นใช้ optional chaining
    if ((error as any)?.code === "PGRST116") return null; // not found
    throw new Error(`getLeadById failed: ${(error as any).message ?? String(error)}`);
  }

  return data as LeadRow;
}

/**
 * อัปเดต lead ที่มี `id` ด้วย `values` ที่ส่งมา
 * - แปลงบาง field ให้เข้ากับ schema (เช่น ถ้าเป็น optional ให้ส่ง `null` แทน undefined)
 * - คืนค่าแถวที่อัปเดต (`LeadRow`) หรือโยน error ถ้า update ล้มเหลว
 */
export async function updateLead(id: string, values: LeadFormValues): Promise<LeadRow> {
  const supabase = await createClient();

  // ถ้า DB มี trigger ให้ updated_at เอง เราไม่จำเป็นต้องส่งค่า updated_at
  // แต่ในกรณีที่ไม่มี trigger ให้ส่ง timestamp ปัจจุบันแทน
  const payload: LeadUpdate = {
    ...values,
    // แปลงค่า optional arrays ให้เป็น null ถ้าไม่กำหนด เพื่อไม่ให้เกิดปัญหาใน DB
    preferred_property_types: (values as any).preferred_property_types ?? null,
    preferred_locations: (values as any).preferred_locations ?? null,
    updated_at: new Date().toISOString(),
  } as unknown as LeadUpdate;

  const { data, error } = await supabase
    .from("leads")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(`updateLead failed: ${error.message}`);
  return data as LeadRow;
}
