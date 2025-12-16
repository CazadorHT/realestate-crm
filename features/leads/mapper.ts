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

    property_id: (row as any).property_id ?? null,
    assigned_to: (row as any).assigned_to ?? null,

    budget_min: (row as any).budget_min ?? null,
    budget_max: (row as any).budget_max ?? null,

    note: (row as any).note ?? null,

    // ฟิลด์ advanced (ถ้าใน schema มี แต่ db อาจเป็น nullable / jsonb)
    preferences: (row as any).preferences ?? null,
    preferred_locations: (row as any).preferred_locations ?? null,
    preferred_property_types: (row as any).preferred_property_types ?? null,

    min_bedrooms: (row as any).min_bedrooms ?? null,
    min_bathrooms: (row as any).min_bathrooms ?? null,
    min_size_sqm: (row as any).min_size_sqm ?? null,
    max_size_sqm: (row as any).max_size_sqm ?? null,

    has_pets: (row as any).has_pets ?? null,
    need_company_registration: (row as any).need_company_registration ?? null,
    allow_airbnb: (row as any).allow_airbnb ?? null,
  };
}
