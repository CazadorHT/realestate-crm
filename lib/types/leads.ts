
import type { LeadActivityType } from "@/features/leads/labels";

export type LeadActivityFormValues = {
  activity_type: LeadActivityType;
  note: string;
  property_id: string | null;
};
