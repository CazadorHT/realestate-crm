import { decrypt } from "@/lib/crypto";
import type { LeadPreferences, LeadRow, LeadWithJoins } from "./types";
import type { LeadFormValues } from "./types";

// แปลง row → form values แบบกัน null ช่วยให้หน้า edit ไม่พัง และทำให้แก้ schema
export function leadRowToFormValues(row: LeadWithJoins | LeadRow): LeadFormValues {
  return {
    // 🛡️ PII Decryption Layer
    full_name: decrypt(row.full_name) || "",
    phone: decrypt(row.phone) ?? null,
    email: decrypt(row.email) ?? null,
    line_id: decrypt(row.line_id) ?? null,
    
    source: row.source ?? null,
    stage: row.stage,

    property_id: row.property_id ?? null,
    assigned_to: row.assigned_to ?? null,

    // Identity
    lead_type: row.lead_type ?? null,
    nationality: row.nationality ?? null,
    is_foreigner: String(row.is_foreigner) === "true",

    budget_min: row.budget_min !== null ? Number(row.budget_min) : null,
    budget_max: row.budget_max !== null ? Number(row.budget_max) : null,

    note: row.note ?? null,
    wechat_id: row.wechat_id ?? null,
    whatsapp: row.whatsapp ?? null,

    // JSONB / Specific fields
    preferences: row.preferences
      ? (row.preferences as unknown as LeadPreferences)
      : null,
    preferred_locations:
      (row.preferred_locations as string[] | null | undefined) ?? null,
    preferred_property_types: row.preferred_property_types ?? null,

    min_bedrooms: row.min_bedrooms !== null ? Number(row.min_bedrooms) : null,
    min_bathrooms: row.min_bathrooms !== null ? Number(row.min_bathrooms) : null,
    min_size_sqm: row.min_size_sqm !== null ? Number(row.min_size_sqm) : null,
    max_size_sqm: row.max_size_sqm !== null ? Number(row.max_size_sqm) : null,
    num_occupants: row.num_occupants !== null ? Number(row.num_occupants) : null,

    has_pets: String(row.has_pets) === "true",
    need_company_registration: String(row.need_company_registration) === "true",
    allow_airbnb: String(row.allow_airbnb) === "true",
  };
}
