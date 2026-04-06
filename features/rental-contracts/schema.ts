import { z } from "zod";
import { Database } from "@/lib/database.types";

export type RentalContract =
  Database["public"]["Tables"]["rental_contracts"]["Row"];
export type RentalContractInsert =
  Database["public"]["Tables"]["rental_contracts"]["Insert"];

const contractBaseSchema = z.object({
  deal_id: z.string().min(1, "กรุณาเลือกดีล เพื่อสร้างสัญญา").uuid("รหัสดีลไม่ถูกต้อง"),
  start_date: z
    .string()
    .min(1, "กรุณาระบุวันที่เริ่มสัญญา")
    .refine((val) => !isNaN(Date.parse(val)), "รูปแบบวันที่ไม่ถูกต้อง"),
  end_date: z
    .string()
    .min(1, "กรุณาระบุวันที่สิ้นสุดสัญญา")
    .refine((val) => !isNaN(Date.parse(val)), "รูปแบบวันที่ไม่ถูกต้อง"),
  rent_price: z.preprocess(
    (v) => (v === "" ? 0 : v),
    z.coerce.number({ message: "กรุณาระบุตัวเลขที่ถูกต้อง" }).min(0, "ราคาต้องไม่ต่ำกว่า 0")
  ),
  deposit_amount: z.preprocess(
    (v) => (v === "" ? null : v),
    z.coerce
      .number({ message: "กรุณาระบุตัวเลขที่ถูกต้อง" })
      .min(0, "เงินประกันต้องไม่ต่ำกว่า 0")
      .optional()
      .nullable()
  ),
  advance_payment_amount: z.preprocess(
    (v) => (v === "" ? null : v),
    z.coerce
      .number({ message: "กรุณาระบุตัวเลขที่ถูกต้อง" })
      .min(0, "เงินล่วงหน้าต้องไม่ต่ำกว่า 0")
      .optional()
      .nullable()
  ),
  lease_term_months: z.coerce
    .number({ message: "กรุณาระบุจำนวนเดือน" })
    .min(1, "ระยะเวลาสัญญาขั้นต่ำ 1 เดือน"),
  payment_cycle: z.string().optional(),
  other_terms: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "TERMINATED"]).optional(),
  contract_number: z.string().optional(),
  tenant_id: z.string().uuid().optional(),
});

export interface ContractDealSummary {
  id: string;
  property_title: string;
  lead_name: string;
  deal_type: string;
  price?: number | null;
  rental_price?: number | null;
  original_price?: number | null;
  original_rental_price?: number | null;
  location?: string | null;
  cover_image_url?: string | null;
  tenant_id?: string | null;
  duration_months?: number | null;
}

const dateRefinement = (data: any, ctx: z.RefinementCtx) => {
  if (data.start_date && data.end_date) {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    if (end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: data.deal_type === "SALE" 
          ? "วันที่โอนต้องไม่ย้อนหลังกว่าวันที่เริ่มสัญญา"
          : "วันที่สิ้นสุดสัญญาต้องอยู่หลังจากวันที่เริ่มสัญญา",
        path: ["end_date"],
      });
    }
  }
};

export const contractFormSchema = contractBaseSchema.superRefine(dateRefinement);

export type ContractFormInput = z.infer<typeof contractFormSchema>;

export const updateContractSchema = contractBaseSchema
  .partial()
  .extend({
    id: z.string().uuid(),
    check_in_date: z.string().optional().nullable(),
    check_out_date: z.string().optional().nullable(),
  })
  .superRefine(dateRefinement);

export type UpdateContractInput = z.infer<typeof updateContractSchema>;
