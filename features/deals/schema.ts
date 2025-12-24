import { z } from "zod";

export const dealStatusEnum = z.enum([
  "NEGOTIATING",
  "SIGNED",
  "CANCELLED",
  "CLOSED_WIN",
  "CLOSED_LOSS",
]);

export const dealTypeEnum = z.enum(["RENT", "SALE"]);

export const createDealSchema = z.object({
  lead_id: z.string().uuid(),
  property_id: z.string().uuid("กรุณาเลือกทรัพย์"),
  deal_type: dealTypeEnum,
  status: dealStatusEnum.default("NEGOTIATING"),
  commission_amount: z.coerce.number().min(0).optional(),
  commission_percent: z.coerce.number().min(0).max(100).optional(),
  co_agent_name: z.string().optional(),
  co_agent_contact: z.string().optional(),
  co_agent_online: z.string().optional(),
  source: z.string().optional(),
  transaction_date: z.string().optional().nullable(), // Closing Date (Sale) or Start Date (Rent)
  transaction_end_date: z.string().optional().nullable(), // End Date (Rent)
  duration_months: z.coerce.number().optional(), // UI helper for Rent duration
});

export type CreateDealInput = z.infer<typeof createDealSchema>;

export const updateDealSchema = createDealSchema.partial().extend({
  id: z.string().uuid(),
  co_agent_name: z.string().nullable().optional(),
  co_agent_contact: z.string().nullable().optional(),
  co_agent_online: z.string().nullable().optional(),
});

export type UpdateDealInput = z.infer<typeof updateDealSchema>;
