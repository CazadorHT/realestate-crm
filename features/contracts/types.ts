export type RentalContractWithRelations = {
  id: string;
  contract_number: string;
  // tenant_name, phone, email might be null on the contract itself if we rely on deal
  tenant_name?: string | null;
  tenant_phone?: string | null;
  tenant_email?: string | null;

  start_date: string;
  end_date: string;
  duration_months: number | null;

  // DB column is rent_price
  rent_price: number | null;
  deposit_amount: number | null;

  deal_id: string;
  deal: {
    id: string;
    lead: {
      id: string;
      full_name: string;
      phone: string | null;
      email: string | null;
    } | null;
    property: {
      title: string;
    } | null;
  } | null;
  created_at?: string;
};
