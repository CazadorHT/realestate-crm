import { z } from "zod";

export const dealStatusEnum = z.enum([
  "NEGOTIATING",
  "SIGNED",
  "CANCELLED",
  "CLOSED_WIN",
  "CLOSED_LOSS",
]);

export const dealTypeEnum = z.enum(["RENT", "SALE"]);

export const getCreateDealSchema = (isEn: boolean) => z.object({
  lead_id: z.string().uuid(isEn ? "Please select a client" : "กรุณาเลือกลูกค้า"),
  property_id: z.string().uuid(isEn ? "Please select a property" : "กรุณาเลือกทรัพย์"),
  deal_type: dealTypeEnum,
  status: dealStatusEnum.default("NEGOTIATING"),
  commission_amount: z.coerce.number().min(0, isEn ? "Commission cannot be less than 0" : "ค่าคอมมิชชั่นต้องไม่ต่ำกว่า 0").optional(),
  commission_percent: z.coerce.number().min(0, isEn ? "Percentage cannot be less than 0" : "เปอร์เซ็นต์ต้องไม่ต่ำกว่า 0").max(100, isEn ? "Percentage cannot exceed 100" : "เปอร์เซ็นต์ต้องไม่เกิน 100").optional(),
  co_agent_name: z.string().optional(),
  co_agent_contact: z.string().optional(),
  co_agent_online: z.string().optional(),
  source: z.string().optional(),
  transaction_date: z.string().optional().nullable(),
  transaction_end_date: z.string().optional().nullable(),
  duration_months: z.coerce.number().min(1, isEn ? "Duration must be at least 1 month" : "ระยะเวลาอย่างน้อย 1 เดือน").optional(),
  undetermined_date: z.boolean().optional(),
  partner_co_broker_id: z.string().uuid().optional().nullable(),
  partner_co_broker_ids: z.array(z.string()).optional(),
  internal_co_agent_id_temp: z.string().optional().nullable(),
});

export const createDealSchema = getCreateDealSchema(false);

export type CreateDealInput = z.infer<typeof createDealSchema>;

export const getUpdateDealSchema = (isEn: boolean) => getCreateDealSchema(isEn).partial().extend({
  id: z.string().uuid(),
  co_agent_name: z.string().nullable().optional(),
  co_agent_contact: z.string().nullable().optional(),
  co_agent_online: z.string().nullable().optional(),
  partner_co_broker_id: z.string().uuid().nullable().optional(),
});

export const updateDealSchema = getUpdateDealSchema(false);

export type UpdateDealInput = z.infer<typeof updateDealSchema>;
