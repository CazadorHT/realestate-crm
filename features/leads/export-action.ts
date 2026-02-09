"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import {
  generateExcelBuffer,
  ExcelColumn,
  formatThaiCurrency,
  formatThaiDate,
} from "@/lib/excel-export";

const LEAD_COLUMNS: ExcelColumn[] = [
  { key: "full_name", header: "ชื่อ-นามสกุล", width: 25 },
  { key: "phone", header: "เบอร์โทร", width: 15 },
  { key: "email", header: "อีเมล", width: 25 },
  { key: "lead_type", header: "ประเภทลูกค้า", width: 15 },
  { key: "source", header: "แหล่งที่มา", width: 12 },
  { key: "stage", header: "สถานะ", width: 12 },
  {
    key: "budget_min",
    header: "งบขั้นต่ำ",
    width: 15,
    format: formatThaiCurrency,
  },
  {
    key: "budget_max",
    header: "งบสูงสุด",
    width: 15,
    format: formatThaiCurrency,
  },
  { key: "nationality", header: "สัญชาติ", width: 12 },
  { key: "note", header: "หมายเหตุ", width: 30 },
  {
    key: "created_at",
    header: "สร้างเมื่อ",
    width: 15,
    format: formatThaiDate,
  },
  {
    key: "updated_at",
    header: "อัปเดตเมื่อ",
    width: 15,
    format: formatThaiDate,
  },
];

export async function exportLeadsAction(ids?: string[]) {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  let query = supabase
    .from("leads")
    .select("*")
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

  const buffer = await generateExcelBuffer(data, LEAD_COLUMNS, "Leads");
  const base64 = buffer.toString("base64");

  return {
    success: true,
    data: base64,
    filename: `leads_${new Date().toISOString().slice(0, 10)}.xlsx`,
    count: data.length,
  };
}
