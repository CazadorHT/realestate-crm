"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import {
  generateExcelBuffer,
  ExcelColumn,
  formatThaiDate,
} from "@/lib/excel-export";

const OWNER_COLUMNS: ExcelColumn[] = [
  { key: "full_name", header: "ชื่อ-นามสกุล", width: 25 },
  { key: "phone", header: "เบอร์โทร", width: 15 },
  { key: "line_id", header: "Line ID", width: 15 },
  { key: "company_name", header: "บริษัท", width: 25 },
  { key: "owner_type", header: "ประเภทเจ้าของ", width: 15 },
  { key: "facebook_url", header: "Facebook", width: 25 },
  { key: "other_contact", header: "การติดต่ออื่นๆ", width: 30 },
  {
    key: "created_at",
    header: "สร้างเมื่อ",
    width: 15,
    format: formatThaiDate,
  },
];

export async function exportOwnersAction(ids?: string[]) {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  let query = supabase
    .from("owners")
    .select("id, full_name, phone, line_id, company_name, owner_type, facebook_url, other_contact, created_at, tenant_id")
    .order("created_at", { ascending: false });

  if (ids && ids.length > 0) {
    query = query.in("id", ids);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, message: error.message };
  }

  if (!data || data.length === 0) {
    return { success: false, message: "ไม่พบข้อมูลสำหรับ export" };
  }

  const buffer = await generateExcelBuffer(data, OWNER_COLUMNS, "Owners");
  const base64 = buffer.toString("base64");

  return {
    success: true,
    data: base64,
    filename: `owners_${new Date().toISOString().slice(0, 10)}.xlsx`,
    count: data.length,
  };
}
