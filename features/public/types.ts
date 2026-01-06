import * as z from "zod";
import { depositLeadSchema, publicPropertyFilterSchema } from "./schema";
import { Database } from "@/lib/database.types";

export type DepositLeadInput = z.infer<typeof depositLeadSchema>;
export type PublicPropertyFilter = z.infer<typeof publicPropertyFilterSchema>;

export type PublicProperty =
  Database["public"]["Tables"]["properties"]["Row"] & {
    property_images: { image_url: string }[];
  };
