"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import {
  generateExcelBuffer,
  ExcelColumn,
  formatThaiCurrency,
  formatThaiDate,
} from "@/lib/excel-export";

const DEAL_COLUMNS: ExcelColumn[] = [
  { key: "property_title", header: "ทรัพย์", width: 30 },
  { key: "lead_name", header: "ลูกค้า", width: 25 },
  { key: "deal_type", header: "ประเภท", width: 10 },
  { key: "status", header: "สถานะ", width: 15 },
  { key: "commission_percent", header: "ค่าคอม (%)", width: 12 },
  {
    key: "commission_amount",
    header: "ค่าคอม (บาท)",
    width: 15,
    format: formatThaiCurrency,
  },
  { key: "co_agent_name", header: "Co-Agent", width: 20 },
  { key: "source", header: "แหล่งที่มา", width: 15 },
  {
    key: "transaction_date",
    header: "วันที่ทำธุรกรรม",
    width: 15,
    format: formatThaiDate,
  },
  {
    key: "created_at",
    header: "สร้างเมื่อ",
    width: 15,
    format: formatThaiDate,
  },
  { key: "closed_at", header: "ปิดเมื่อ", width: 15, format: formatThaiDate },
];

export async function exportDealsAction(ids?: string[]) {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  let query = supabase
    .from("deals")
    .select(
      `
      *,
      property:properties(title),
      lead:leads(full_name)
    `,
    )
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

  // Flatten data for Excel
  const flatData = data.map((d) => ({
    ...d,
    property_title: d.property?.title || "-",
    lead_name: d.lead?.full_name || "-",
  }));

  const buffer = await generateExcelBuffer(flatData, DEAL_COLUMNS, "Deals");
  const base64 = buffer.toString("base64");

  return {
    success: true,
    data: base64,
    filename: `deals_${new Date().toISOString().slice(0, 10)}.xlsx`,
    count: data.length,
  };
}
