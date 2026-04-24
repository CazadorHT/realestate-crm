import { createClient } from "@/lib/supabase/server";
import { PropertyCRMDetails } from "./PropertyCRMDetails";

interface PropertyRelatedDealsSectionProps {
  propertyId: string;
  isClosed: boolean;
  property: any;
  tenantId: string | undefined;
}

interface RelatedDeal {
  id: string;
  deal_type: string;
  commission_amount: number | null;
  commission_percent: number | null;
  created_by: string | null;
  status: string;
  lead: {
    id: string;
    full_name: string;
  } | null;
}

export async function PropertyRelatedDealsSection({
  propertyId,
  isClosed,
  property,
  tenantId,
}: PropertyRelatedDealsSectionProps) {
  const supabase = await createClient();

  // 1. Fetch related closed deal (if property sold/rented)
  let relatedDeal: RelatedDeal | null = null;
  let relatedContract: any = null;

  if (isClosed) {
    const { data: dealData } = await supabase
      .from("deals")
      .select(
        "id, deal_type, commission_amount, commission_percent, created_by, status, lead:leads(id, full_name)",
      )
      .eq("property_id", propertyId)
      .eq("status", "CLOSED_WIN")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    relatedDeal = (dealData as unknown as RelatedDeal) ?? null;

    if (relatedDeal) {
      const { data: contractData } = await supabase
        .from("rental_contracts")
        .select("id, deal_id, start_date, end_date, rent_price, deposit_amount, lease_term_months, status")
        .eq("deal_id", relatedDeal.id)
        .single();
      relatedContract = contractData ?? null;
    }
  }

  const commissionLabel = relatedDeal
    ? relatedDeal.commission_amount != null
      ? `฿${Number(relatedDeal.commission_amount).toLocaleString()}`
      : relatedDeal.commission_percent != null
        ? `${Number(relatedDeal.commission_percent).toLocaleString()}%`
        : "-"
    : "-";

  return (
    <PropertyCRMDetails
      property={property}
      relatedDeal={relatedDeal}
      relatedContract={relatedContract}
      commissionLabel={commissionLabel}
      tenantId={tenantId}
    />
  );
}
