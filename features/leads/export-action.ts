"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { cookies } from "next/headers";
import {
  generateExcelBuffer,
  ExcelColumn,
  formatThaiCurrency,
  formatThaiDate,
} from "@/lib/excel-export";

function getLeadColumns(isEn: boolean): ExcelColumn[] {
  return [
    { key: "full_name", header: isEn ? "Full Name" : "ชื่อ-นามสกุล", width: 25 },
    { key: "phone", header: isEn ? "Phone Number" : "เบอร์โทร", width: 15 },
    { key: "email", header: isEn ? "Email" : "อีเมล", width: 25 },
    { key: "lead_type", header: isEn ? "Lead Type" : "ประเภทลูกค้า", width: 15 },
    { key: "source", header: isEn ? "Source" : "แหล่งที่มา", width: 12 },
    { key: "stage", header: isEn ? "Stage" : "สถานะ", width: 12 },
    {
      key: "budget_min",
      header: isEn ? "Min Budget" : "งบขั้นต่ำ",
      width: 15,
      format: formatThaiCurrency,
    },
    {
      key: "budget_max",
      header: isEn ? "Max Budget" : "งบสูงสุด",
      width: 15,
      format: formatThaiCurrency,
    },
    { key: "nationality", header: isEn ? "Nationality" : "สัญชาติ", width: 12 },
    { key: "note", header: isEn ? "Note" : "หมายเหตุ", width: 30 },
    {
      key: "created_at",
      header: isEn ? "Created At" : "สร้างเมื่อ",
      width: 15,
      format: formatThaiDate,
    },
    {
      key: "updated_at",
      header: isEn ? "Updated At" : "อัปเดตเมื่อ",
      width: 15,
      format: formatThaiDate,
    },
  ];
}

export async function exportLeadsAction(ids?: string[]) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value || "th") as "th" | "en";
  const isEn = lang === "en";

  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  let query = supabase
    .from("leads")
    .select("id, full_name, phone, email, source, stage, budget_max, created_at, tenant_id")
    .order("created_at", { ascending: false });

  if (ids && ids.length > 0) {
    query = query.in("id", ids);
  } else {
    query = query.limit(500); // 🛡️ Cap full exports to 500 rows max for Low-Egress safety
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, message: error.message };
  }

  if (!data || data.length === 0) {
    return { success: false, message: isEn ? "No data to export" : "ไม่พบข้อมูลสำหรับ export" };
  }

  const columns = getLeadColumns(isEn);
  const buffer = await generateExcelBuffer(data, columns, "Leads");
  const base64 = buffer.toString("base64");

  return {
    success: true,
    data: base64,
    filename: `leads_${new Date().toISOString().slice(0, 10)}.xlsx`,
    count: data.length,
  };
}

