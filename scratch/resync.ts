import { createAdminClient } from "@/lib/supabase/admin";

async function resyncAllClosedDeals() {
  const supabase = createAdminClient();
  const { data: deals, error } = await supabase
    .from("crm_deals_v3")
    .select("id, tenant_id")
    .eq("status", "CLOSED_WIN");

  if (error || !deals) {
    console.error("Error fetching deals:", error);
    return;
  }

  console.log(`Found ${deals.length} closed deals to resync...`);

  for (const deal of deals) {
    const dealId = deal.id;
    const tenantId = deal.tenant_id;

    // Delete existing
    await supabase
      .from("financial_ledger_v3")
      .delete()
      .eq("reference_entity", "DEAL")
      .eq("reference_id", dealId)
      .eq("transaction_type", "deal_closed");

    const { data: dealDetail } = await supabase
      .from("crm_deals_v3")
      .select("id, status, commission_total, branch_id")
      .eq("id", dealId)
      .single();

    if (!dealDetail) continue;

    const grossCommission = Number(dealDetail.commission_total) || 0;
    if (grossCommission <= 0) continue;

    const { data: commissions } = await supabase
      .from("crm_deal_commissions_v3")
      .select("recipient_role, amount, net_amount, tax_amount")
      .eq("deal_id", dealId)
      .eq("tenant_id", tenantId);

    let coAgentGross = 0;
    if (commissions && commissions.length > 0) {
      coAgentGross = commissions
        .filter((c: { recipient_role: string }) => c.recipient_role === "CO_AGENT")
        .reduce((sum: number, c: { amount: number | null }) => sum + (Number(c.amount) || 0), 0);
    }

    const netCompanyAmount = Math.max(0, grossCommission - coAgentGross);

    let agencyNet = 0;
    if (commissions && commissions.length > 0) {
      const agencyComm = commissions.find((c: { recipient_role: string }) => c.recipient_role === "AGENCY");
      if (agencyComm) {
        agencyNet = Number(agencyComm.net_amount ?? agencyComm.amount) || 0;
      } else {
        const agentSplits = commissions
          .filter((c: { recipient_role: string }) => c.recipient_role !== "AGENCY")
          .reduce((sum: number, c: { amount: number | null }) => sum + (Number(c.amount) || 0), 0);
        agencyNet = Math.max(0, grossCommission - agentSplits);
      }
    } else {
      agencyNet = netCompanyAmount;
    }

    const { error: insErr } = await supabase.from("financial_ledger_v3").insert({
      tenant_id: tenantId,
      branch_id: dealDetail.branch_id || null,
      transaction_type: "deal_closed",
      reference_entity: "DEAL",
      reference_id: dealId,
      amount_net: agencyNet,
      amount_total: netCompanyAmount,
      tax_amount: 0,
      wht_amount: 0,
      status: "cleared",
      metadata: {
        gross_commission: grossCommission,
        co_agent_deduction: coAgentGross,
        agency_net: agencyNet,
        synced_at: new Date().toISOString(),
      },
    });

    if (insErr) {
      console.error(`Failed ins deal ${dealId}:`, insErr);
    } else {
      console.log(`Synced deal ${dealId} | amount_net: ${agencyNet} | amount_total: ${netCompanyAmount}`);
    }
  }
}

resyncAllClosedDeals();
