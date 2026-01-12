import * as z from "zod";
import {
  depositLeadSchema,
  publicPropertyFilterSchema,
  inquiryLeadSchema,
} from "./schema";
import { Database } from "@/lib/database.types";

export type DepositLeadInput = z.infer<typeof depositLeadSchema>;
export type InquiryLeadInput = z.infer<typeof inquiryLeadSchema>;
export type PublicPropertyFilter = z.infer<typeof publicPropertyFilterSchema>;

export type LeadState = {
  success?: boolean;
  error?: string;
  errors?: {
    fullName?: string[];
    phone?: string[];
    message?: string[];
  };
};

export type PublicProperty =
  Database["public"]["Tables"]["properties"]["Row"] & {
    property_images: { image_url: string }[];
  };
