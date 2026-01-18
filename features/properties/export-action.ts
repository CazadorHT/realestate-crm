"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import {
  generateExcelBuffer,
  ExcelColumn,
  formatThaiCurrency,
  formatThaiDate,
  formatBoolean,
} from "@/lib/excel-export";

const PROPERTY_COLUMNS: ExcelColumn[] = [
  { key: "title", header: "ชื่อทรัพย์", width: 30 },
  { key: "property_type", header: "ประเภท", width: 15 },
  { key: "listing_type", header: "ประเภทประกาศ", width: 12 },
  { key: "status", header: "สถานะ", width: 12 },
  {
    key: "sale_price",
    header: "ราคาขาย",
    width: 15,
    format: formatThaiCurrency,
  },
  {
    key: "rent_price",
    header: "ราคาเช่า/เดือน",
    width: 15,
    format: formatThaiCurrency,
  },
  { key: "bedrooms", header: "ห้องนอน", width: 10 },
  { key: "bathrooms", header: "ห้องน้ำ", width: 10 },
  { key: "size_sqm", header: "พื้นที่ (ตร.ม.)", width: 12 },
  { key: "district", header: "เขต/อำเภอ", width: 15 },
  { key: "province", header: "จังหวัด", width: 15 },
  {
    key: "is_near_train",
    header: "ใกล้รถไฟฟ้า",
    width: 12,
    format: formatBoolean,
  },
  {
    key: "is_pet_friendly",
    header: "เลี้ยงสัตว์ได้",
    width: 12,
    format: formatBoolean,
  },
  {
    key: "created_at",
    header: "สร้างเมื่อ",
    width: 15,
    format: formatThaiDate,
  },
];

export async function exportPropertiesAction(ids?: string[]) {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  let query = supabase
    .from("properties")
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

  const buffer = generateExcelBuffer(data, PROPERTY_COLUMNS, "Properties");
  const base64 = buffer.toString("base64");

  return {
    success: true,
    data: base64,
    filename: `properties_${new Date().toISOString().slice(0, 10)}.xlsx`,
    count: data.length,
  };
}
