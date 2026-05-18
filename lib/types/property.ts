import { Database } from "@/lib/database.types.generated";

export type Property = Database["public"]["Views"]["properties"]["Row"] & {
  images?: string[] | null;
};
