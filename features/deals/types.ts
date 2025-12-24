import { Database } from "@/lib/database.types";

export type DealStatus = Database["public"]["Enums"]["deal_status"];
export type DealType = Database["public"]["Enums"]["deal_type"];

export type Deal = Database["public"]["Tables"]["deals"]["Row"];

// View model that includes the joined property title/code
export type DealWithProperty = Deal & {
  property: {
    id: string;
    title: string;
    price: number | null;
    rental_price: number | null;
    images: any;
  } | null;
  lead?: { id: string; full_name?: string } | null;
  co_agent_online?: string | null;
};
