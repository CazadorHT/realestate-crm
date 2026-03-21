import { Database } from "@/lib/database.types";

export type RentalContract = Database["public"]["Tables"]["rental_contracts"]["Row"];

export type RentalContractWithRelations = RentalContract & {
  deal: {
    id: string;
    property: {
      id: string;
      title: string;
    } | null;
    lead: {
      id: string;
      full_name: string;
      phone: string | null;
      email: string | null;
    } | null;
  } | null;
};
