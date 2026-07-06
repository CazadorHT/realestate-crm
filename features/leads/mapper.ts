import { decrypt } from "@/lib/crypto";
import type { LeadPreferences, LeadRow, LeadWithJoins } from "./types";
import type { LeadFormValues } from "./types";

// แปลง row → form values แบบกัน null ช่วยให้หน้า edit ไม่พัง และทำให้แก้ schema
export function leadRowToFormValues(row: Partial<LeadWithJoins>): LeadFormValues {
  return {
    // 🛡️ PII Decryption Layer
    full_name: decrypt(row.full_name ?? null) || "",
    phone: decrypt(row.phone ?? null) ?? null,
    email: decrypt(row.email ?? null) ?? null,
    line_id: decrypt(row.line_id ?? null) ?? null,
    
    source: (row.source as LeadFormValues["source"]) ?? null,
    stage: (row.stage as LeadFormValues["stage"]) || "NEW",

    property_id: row.property_id ?? null,
    assigned_to: row.assigned_to ?? null,

    // Identity
    lead_type: (row.lead_type as any) ?? null,
    nationality: row.nationality ?? null,
    is_foreigner: (row.is_foreigner as unknown) === "true" || !!row.is_foreigner,
    id_card: row.id_card ?? null,
    passport: row.passport ?? null,

    budget_min: row.budget_min !== null && row.budget_min !== undefined ? Number(row.budget_min) : null,
    budget_max: row.budget_max !== null && row.budget_max !== undefined ? Number(row.budget_max) : null,

    note: row.note ?? null,
    wechat_id: row.wechat_id ?? null,
    whatsapp: row.whatsapp ?? null,

    // JSONB / Specific fields
    preferences: row.preferences
      ? (row.preferences as Record<string, unknown>)
      : null,
    preferred_locations:
      (row.preferred_locations as string[] | null | undefined) ?? null,
    preferred_property_types: (row.preferred_property_types as any[] | null | undefined) ?? null,

    min_bedrooms: row.min_bedrooms !== null && row.min_bedrooms !== undefined ? Number(row.min_bedrooms) : null,
    min_bathrooms: row.min_bathrooms !== null && row.min_bathrooms !== undefined ? Number(row.min_bathrooms) : null,
    min_size_sqm: row.min_size_sqm !== null && row.min_size_sqm !== undefined ? Number(row.min_size_sqm) : null,
    max_size_sqm: row.max_size_sqm !== null && row.max_size_sqm !== undefined ? Number(row.max_size_sqm) : null,
    num_occupants: row.num_occupants !== null && row.num_occupants !== undefined ? Number(row.num_occupants) : null,

    has_pets: (row.has_pets as unknown) === "true" || !!row.has_pets,
    need_company_registration: (row.need_company_registration as unknown) === "true" || !!row.need_company_registration,
    allow_airbnb: (row.allow_airbnb as unknown) === "true" || !!row.allow_airbnb,
  };
}
