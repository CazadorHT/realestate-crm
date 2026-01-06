import type { LeadRow } from "./types";
import type { LeadFormValues } from "./types";
// แปลง row → form values แบบกัน null ช่วยให้หน้า edit ไม่พัง และทำให้แก้ schema
export function leadRowToFormValues(row: LeadRow): LeadFormValues {
  return {
    full_name: row.full_name,
    phone: row.phone ?? null,
    email: row.email ?? null,
    source: row.source ?? null,
    stage: row.stage,

    property_id: row.property_id ?? null,
    assigned_to: row.assigned_to ?? null,

    // Identity
    lead_type: row.lead_type ?? null,
    nationality: row.nationality ?? null,
    is_foreigner: row.is_foreigner ?? false,

    budget_min: row.budget_min ?? null,
    budget_max: row.budget_max ?? null,

    note: row.note ?? null,

    // JSONB / Specific fields
    preferences: row.preferences
      ? (row.preferences as Record<string, any>)
      : null,
    preferred_locations:
      (row.preferred_locations as string[] | null | undefined) ?? null,
    preferred_property_types: row.preferred_property_types ?? null,

    min_bedrooms: row.min_bedrooms ?? null,
    min_bathrooms: row.min_bathrooms ?? null,
    min_size_sqm: row.min_size_sqm ?? null,
    max_size_sqm: row.max_size_sqm ?? null,
    num_occupants: row.num_occupants ?? null,

    has_pets: row.has_pets ?? false,
    need_company_registration: row.need_company_registration ?? false,
    allow_airbnb: row.allow_airbnb ?? false,
  };
}
