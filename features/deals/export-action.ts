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

function getDealColumns(isEn: boolean): ExcelColumn[] {
  return [
    { key: "property_title", header: isEn ? "Property" : "ทรัพย์", width: 30 },
    { key: "lead_name", header: isEn ? "Client / Lead" : "ลูกค้า", width: 25 },
    { key: "deal_type", header: isEn ? "Deal Type" : "ประเภท", width: 10 },
    { key: "status", header: isEn ? "Status" : "สถานะ", width: 15 },
    { key: "commission_percent", header: isEn ? "Commission (%)" : "ค่าคอม (%)", width: 12 },
    {
      key: "commission_amount",
      header: isEn ? "Commission (THB)" : "ค่าคอม (บาท)",
      width: 15,
      format: formatThaiCurrency,
    },
    { key: "co_agent_name", header: "Co-Agent", width: 20 },
    { key: "source", header: isEn ? "Source" : "แหล่งที่มา", width: 15 },
    {
      key: "transaction_date",
      header: isEn ? "Transaction Date" : "วันที่ทำธุรกรรม",
      width: 15,
      format: formatThaiDate,
    },
    {
      key: "created_at",
      header: isEn ? "Created At" : "สร้างเมื่อ",
      width: 15,
      format: formatThaiDate,
    },
    { key: "closed_at", header: isEn ? "Closed At" : "ปิดเมื่อ", width: 15, format: formatThaiDate },
  ];
}

export async function exportDealsAction(ids?: string[]) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value || "th") as "th" | "en";
  const isEn = lang === "en";

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
    return { success: false, message: isEn ? "No data to export" : "ไม่พบข้อมูลสำหรับ export" };
  }

  // Flatten data for Excel
  const flatData = data.map((d) => ({
    ...d,
    property_title: d.property?.title || "-",
    lead_name: d.lead?.full_name || "-",
  }));

  const columns = getDealColumns(isEn);
  const buffer = await generateExcelBuffer(flatData, columns, "Deals");
  const base64 = buffer.toString("base64");

  return {
    success: true,
    data: base64,
    filename: `deals_${new Date().toISOString().slice(0, 10)}.xlsx`,
    count: data.length,
  };
}

