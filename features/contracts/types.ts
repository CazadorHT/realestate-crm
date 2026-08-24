export type RentalContractWithRelations = {
  id: string;
  contract_number: string;
  start_date: string;
  end_date: string;
  lease_term_months: number | null;
  rent_price: number | null;
  deposit_amount: number | null;
  created_at: string | null;
  deal_id: string;
  status: string;
  tenant_id: string;
  deal: {
    id: string;
    property: {
      id: string;
      title: string;
      title_en?: string | null;
      project_name?: string | null;
      project_name_en?: string | null;
      cover_image_url?: string | null;
    } | null;
    lead: {
      id: string;
      full_name: string;
      phone: string | null;
      email: string | null;
      line_id?: string | null;
      wechat_id?: string | null;
      whatsapp?: string | null;
      facebook?: string | null;
    } | null;
  } | null;
};
