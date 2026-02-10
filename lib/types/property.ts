import { Database } from "@/lib/database.types";

export type Property = Database["public"]["Tables"]["properties"]["Row"] & {
  images?: string[] | null;
};
