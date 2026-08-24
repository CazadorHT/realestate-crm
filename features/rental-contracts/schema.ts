import { z } from "zod";
import { Database } from "@/lib/database.types.generated";

export interface RentalContract {
  id: string;
  deal_id: string;
  start_date?: string;
  end_date?: string;
  rent_price?: number;
  deposit_amount?: number | null;
  lease_term_months?: number;
  payment_cycle?: string;
  other_terms?: string;
  advance_payment_amount?: number | null;
  status: "DRAFT" | "ACTIVE" | "TERMINATED";
  contract_number?: string;
}
export type RentalContractInsert =
  Database["public"]["Tables"]["crm_deals_v3"]["Insert"];

const getContractBaseSchema = (isEn: boolean) => z.object({
  deal_id: z.string().min(1, isEn ? "Please select a deal to create contract" : "กรุณาเลือกดีล เพื่อสร้างสัญญา").uuid(isEn ? "Invalid deal ID" : "รหัสดีลไม่ถูกต้อง"),
  start_date: z
    .string()
    .min(1, isEn ? "Please specify start date" : "กรุณาระบุวันที่เริ่มสัญญา")
    .refine((val) => !isNaN(Date.parse(val)), isEn ? "Invalid date format" : "รูปแบบวันที่ไม่ถูกต้อง"),
  end_date: z
    .string()
    .min(1, isEn ? "Please specify end date" : "กรุณาระบุวันที่สิ้นสุดสัญญา")
    .refine((val) => !isNaN(Date.parse(val)), isEn ? "Invalid date format" : "รูปแบบวันที่ไม่ถูกต้อง"),
  rent_price: z.preprocess(
    (v) => (v === "" ? 0 : v),
    z.coerce.number({ message: isEn ? "Please enter a valid number" : "กรุณาระบุตัวเลขที่ถูกต้อง" }).min(0, isEn ? "Price cannot be less than 0" : "ราคาต้องไม่ต่ำกว่า 0")
  ),
  deposit_amount: z.preprocess(
    (v) => (v === "" ? null : v),
    z.coerce
      .number({ message: isEn ? "Please enter a valid number" : "กรุณาระบุตัวเลขที่ถูกต้อง" })
      .min(0, isEn ? "Deposit cannot be less than 0" : "เงินประกันต้องไม่ต่ำกว่า 0")
      .optional()
      .nullable()
  ),
  advance_payment_amount: z.preprocess(
    (v) => (v === "" ? null : v),
    z.coerce
      .number({ message: isEn ? "Please enter a valid number" : "กรุณาระบุตัวเลขที่ถูกต้อง" })
      .min(0, isEn ? "Advance payment cannot be less than 0" : "เงินล่วงหน้าต้องไม่ต่ำกว่า 0")
      .optional()
      .nullable()
  ),
  lease_term_months: z.coerce
    .number({ message: isEn ? "Please specify number of months" : "กรุณาระบุจำนวนเดือน" })
    .min(1, isEn ? "Minimum contract period is 1 month" : "ระยะเวลาสัญญาขั้นต่ำ 1 เดือน"),
  payment_cycle: z.string().optional(),
  other_terms: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "TERMINATED"]).optional(),
  contract_number: z.string().optional(),
  tenant_id: z.string().uuid().optional(),
  deal_type: z.string().optional(),
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

const getDateRefinement = (isEn: boolean) => (data: { start_date?: string; end_date?: string; deal_type?: string; [key: string]: unknown }, ctx: z.RefinementCtx) => {
  if (data.start_date && data.end_date) {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    if (end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: data.deal_type === "SALE" 
          ? (isEn ? "Transfer date cannot be earlier than agreement start date" : "วันที่โอนต้องไม่ย้อนหลังกว่าวันที่เริ่มสัญญา")
          : (isEn ? "Contract end date must be after start date" : "วันที่สิ้นสุดสัญญาต้องอยู่หลังจากวันที่เริ่มสัญญา"),
        path: ["end_date"],
      });
    }
  }
};

export const getContractFormSchema = (isEn: boolean) => getContractBaseSchema(isEn).superRefine(getDateRefinement(isEn));

export const contractFormSchema = getContractFormSchema(false);
export const contractBaseSchema = getContractBaseSchema(false);

export type ContractFormInput = z.infer<typeof contractFormSchema>;

export const getUpdateContractSchema = (isEn: boolean) => getContractBaseSchema(isEn)
  .partial()
  .extend({
    id: z.string().uuid(),
    check_in_date: z.string().optional().nullable(),
    check_out_date: z.string().optional().nullable(),
  })
  .superRefine(getDateRefinement(isEn));

export const updateContractSchema = getUpdateContractSchema(false);
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
