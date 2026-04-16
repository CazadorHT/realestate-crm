import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

/**
 * Ironclad Scoped Client for Revenue & Deals (V2 - Fluent API)
 * Automatically enforces branch isolation (tenant_id) for both READ and WRITE operations.
 */
export function getScopedRevenueClient(
  supabase: SupabaseClient<Database>,
  tenantId: string | undefined
) {
  const isAll = !tenantId || tenantId === "ALL";

  return {
    /**
     * Fluent Table Wrapper
     */
    from: (table: "deals" | "deal_commissions") => {
      const builder = supabase.from(table);

      return {
        select: (columns: string = "*"): any => {
          let q = builder.select(columns);
          if (!isAll) q = q.eq("tenant_id", tenantId) as any;
          return q;
        },
        insert: (data: any): any => {
          const payload = Array.isArray(data)
            ? data.map((d: any) => ({ ...d, tenant_id: tenantId }))
            : { ...data, tenant_id: tenantId };
          return builder.insert(payload);
        },
        update: (data: any): any => {
          let q = builder.update(data);
          if (!isAll) q = q.eq("tenant_id", tenantId) as any;
          return q;
        },
        delete: (): any => {
          let q = builder.delete();
          if (!isAll) q = q.eq("tenant_id", tenantId) as any;
          return q;
        },
      };
    },

    deals: () => {
      return (getScopedRevenueClient(supabase, tenantId) as any).from("deals");
    },

    commissions: () => {
      return (getScopedRevenueClient(supabase, tenantId) as any).from("deal_commissions");
    },

    /**
     * Scoped RPC wrapper
     */
    rpc: (name: string, args: Record<string, any> = {}): any => {
      return supabase.rpc(name as any, { ...args, p_tenant_id: tenantId });
    },

    tenantId,
    raw: supabase,
  };
}
