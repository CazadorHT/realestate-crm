import { z } from "zod";
import { Database } from "@/lib/database.types";

export type RentalContract =
  Database["public"]["Tables"]["rental_contracts"]["Row"];

export const contractFormSchema = z.object({
  deal_id: z.string().uuid(),
  start_date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid Date"),
  end_date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid Date"),
  rent_price: z.coerce.number().min(0, "ราคาค่าเช่าต้องไม่ต่ำกว่า 0"),
  deposit_amount: z.coerce
    .number()
    .min(0, "เงินประกันต้องไม่ต่ำกว่า 0")
    .optional(),
  lease_term_months: z.coerce.number().min(1, "ระยะเวลาสัญญาขั้นต่ำ 1 เดือน"),
  payment_cycle: z.string().optional(),
  other_terms: z.string().optional(),
  status: z.enum(["DRAFT","ACTIVE","TERMINATED"]).optional(),
});

export type ContractFormInput = z.infer<typeof contractFormSchema>;

export const updateContractSchema = contractFormSchema.partial().extend({
  id: z.string().uuid(),
  check_in_date: z.string().optional().nullable(),
  check_out_date: z.string().optional().nullable(),
});

export type UpdateContractInput = z.infer<typeof updateContractSchema>;
