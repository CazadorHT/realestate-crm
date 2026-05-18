import { createClient } from "@/lib/supabase/server";
import { PropertyCRMDetails } from "./PropertyCRMDetails";
import type { PropertyWithDetails, RelatedDealV3 as RelatedDeal, DealMetadataV3 } from "@/features/properties/types/v3";

interface PropertyRelatedDealsSectionProps {
  propertyId: string;
  isClosed: boolean;
  property: PropertyWithDetails;
  tenantId: string | undefined;
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
    // 1. Fetch related closed win deal using V3 Core table (crm_deals_v3)
    const { data: dealData } = await supabase
      .from("crm_deals_v3")
      .select(`
        id,
        title,
        status,
        deal_type,
        total_amount,
        commission_total,
        created_by,
        metadata,
        transaction_date,
        transaction_end_date,
        created_at,
        agent:identities_v3!crm_deals_v3_agent_id_fkey (
          id,
          display_name,
          avatar_url
        ),
        lead:crm_leads_v3 (
          id,
          identity:identities_v3 (
            id,
            display_name
          )
        )
      `)
      .eq("property_id", propertyId)
      .eq("status", "CLOSED_WIN")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dealData) {
      const metadata = dealData.metadata as unknown as DealMetadataV3;

      // Map V3 structure to local type safely
      relatedDeal = {
        id: dealData.id,
        deal_type: dealData.deal_type,
        commission_amount: dealData.commission_total as unknown as number,
        commission_percent: metadata?.commission_percent ?? null,
        created_by: dealData.created_by,
        status: dealData.status,
        lead: dealData.lead?.identity ? {
          id: dealData.lead.id,
          full_name: dealData.lead.identity.display_name
        } : null
      };

      // 2. Map V3 "Unified" Contract Details directly from Deal Data
      relatedContract = {
        id: dealData.id, // Using deal ID as contract ID reference in V3
        start_date: dealData.transaction_date,
        end_date: dealData.transaction_end_date,
        rent_price: dealData.total_amount,
        deposit_amount: metadata?.deposit_amount,
        lease_term_months: metadata?.lease_term_months,
        status: dealData.status === "CLOSED_WIN" ? "ACTIVE" : dealData.status
      };
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
