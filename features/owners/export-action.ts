"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import {
  generateExcelBuffer,
  ExcelColumn,
  formatThaiDate,
} from "@/lib/excel-export";
import { decrypt } from "@/lib/crypto";

const getOwnerColumns = (isEn: boolean): ExcelColumn[] => [
  { key: "full_name", header: isEn ? "Full Name" : "ชื่อ-นามสกุล", width: 25 },
  { key: "phone", header: isEn ? "Phone Number" : "เบอร์โทร", width: 15 },
  { key: "line_id", header: "Line ID", width: 15 },
  { key: "company_name", header: isEn ? "Company" : "บริษัท", width: 25 },
  { key: "owner_type", header: isEn ? "Owner Type" : "ประเภทเจ้าของ", width: 15 },
  { key: "facebook_url", header: "Facebook", width: 25 },
  { key: "other_contact", header: isEn ? "Other Contact" : "การติดต่ออื่นๆ", width: 30 },
  {
    key: "created_at",
    header: isEn ? "Created At" : "สร้างเมื่อ",
    width: 15,
    format: formatThaiDate,
  },
];

export async function exportOwnersAction(ids?: string[]) {
  const cookieStore = await cookies();
  const lang = cookieStore.get("language")?.value || "th";
  const isEn = lang === "en";

  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  let query = supabase
    .from("identities_v3")
    .select("id, display_name, phone, line_id, social_links, created_at, tenant_id")
    .eq("category", 2)
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

  const decryptedData = data.map((o: any) => {
    const social = (o.social_links as Record<string, any>) || {};
    return {
      id: o.id,
      full_name: decrypt(o.display_name) || o.display_name || "Unknown",
      phone: decrypt(o.phone) || o.phone,
      line_id: decrypt(o.line_id) || o.line_id,
      facebook_url: decrypt(social.facebook_url) || social.facebook_url,
      other_contact: decrypt(social.other_contact) || social.other_contact,
      company_name: social.company_name,
      owner_type: social.owner_type,
      created_at: o.created_at,
      tenant_id: o.tenant_id,
    };
  });

  const buffer = await generateExcelBuffer(decryptedData as Record<string, unknown>[], getOwnerColumns(isEn), "Owners");
  const base64 = buffer.toString("base64");

  return {
    success: true,
    data: base64,
    filename: `owners_${new Date().toISOString().slice(0, 10)}.xlsx`,
    count: data.length,
  };
}
