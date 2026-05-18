// src/types/db.ts
import type { Database } from "@/lib/database.types";

export type PropertyRow = Database["public"]["Tables"]["properties_core"]["Row"];
export type PropertyInsert = Database["public"]["Tables"]["properties_core"]["Insert"];
export type PropertyUpdate = Database["public"]["Tables"]["properties_core"]["Update"];

export type LeadRow = Database["public"]["Tables"]["crm_leads_v3"]["Row"];
export type LeadInsert = Database["public"]["Tables"]["crm_leads_v3"]["Insert"];
export type LeadUpdate = Database["public"]["Tables"]["crm_leads_v3"]["Update"];
