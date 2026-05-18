import { SupabaseClient } from "@supabase/supabase-js";
import { TaxLogic } from "@/lib/finance/tax-logic";
import { Database } from "@/lib/database.types";

/**
 * 🏛️ Tax Resolution Service
 * Orchestrates the data fetching and logic application for determining effective tax rates.
 */
export const TaxService = {
  /**
   * Resolves the effective tax rate for a specific agent and tenant context.
   * This handles the hierarchy: Agent > Tenant > Global Default
   */
  async resolveEffectiveRate(
    supabase: SupabaseClient<Database>,
    params: {
      agentId?: string | null;
      tenantId: string;
      explicitRate?: number | null;
      globalDefaultWht?: number;
    }
  ): Promise<number> {
    const { agentId, tenantId, explicitRate, globalDefaultWht = 3 } = params;

    // 1. If an explicit rate is already provided (e.g., manually overridden), use it
    if (typeof explicitRate === "number" && explicitRate >= 0) {
      return TaxLogic.sanitizeRate(explicitRate);
    }

    // 2. Fetch Agent's default tax rate
    let agentDefaultRate: number | null = null;
    if (agentId) {
      const { data: agentProfile } = await supabase
        .from("identity_secrets_v3")
        .select("tax_info")
        .eq("identity_id", agentId)
        .single();
      
      const defaultTaxRate = (agentProfile?.tax_info as any)?.default_tax_rate;
      agentDefaultRate = TaxLogic.percentToDecimal(defaultTaxRate);
    }

    // 3. Fetch Tenant's default tax rate (Optional, if we had one in tenant settings)
    // For now, we use the globalDefaultWht provided from commission rules
    const tenantDefaultRate = null; // Placeholder if we add per-tenant WHT later

    // 4. Resolve via Hierarchy
    return TaxLogic.resolveTaxRate({
      agentTaxRate: agentDefaultRate,
      tenantTaxRate: tenantDefaultRate,
      globalDefaultRate: TaxLogic.percentToDecimal(globalDefaultWht),
    });
  },
};
