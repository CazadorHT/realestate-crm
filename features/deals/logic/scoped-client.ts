import { Database } from "@/lib/database.types.generated";
import { AuthContext } from "@/lib/authz";

/**
 * The Runtime Proxy Injector (V3 Hardened)
 * 
 * Intercepts method calls (`select`, `insert`, `upsert`, `update`, `delete`) to the generic Supabase Query Builder
 * and dynamically injects Branch Isolation (tenant_id) while preserving 100% native Type Inference.
 * 
 * ⚠️ VULNERABILITY WARNING (SDK EVOLUTION RISK):
 * This Proxy only intercepts specific data-modifying/query methods defined below.
 * IF Supabase introduces new builder functions (e.g., `bulkX`, `stream`), they will BYPASS
 * this tenant isolation unless explicitly added to the proxy trap condition.
 * DO NOT use un-proxied data modification methods directly via `scoped.table()`.
 */
function createScopedProxy<T extends keyof Database["public"]["Tables"]>(
  supabase: AuthContext["supabase"],
  tableName: T,
  tenantId: string | undefined
) {
  const isAll = !tenantId || tenantId === "ALL";
  const builder = supabase.from(tableName);

  // NOTE: Proxy handlers operate at the JavaScript runtime level where
  // strict TypeScript typing is inherently limited. Using 'any' inside
  // Proxy traps is INTENTIONAL and UNAVOIDABLE — TypeScript cannot
  // statically type dynamic property interception. Type safety is
  // enforced at the PUBLIC API surface (getScopedRevenueClient return
  // type and table name validation) rather than inside Proxy internals.
  return new Proxy(builder, {
    get(target: any, prop: string) {
      const origMethod = target[prop];
      if (typeof origMethod !== "function") {
        return origMethod;
      }

      if (prop === "select") {
        return (...args: any[]) => {
          let chain = origMethod.apply(target, args);
          if (!isAll && tenantId) {
            chain = chain.eq("tenant_id", tenantId);
          }
          return chain;
        };
      }

      if (prop === "insert" || prop === "upsert") {
        return (...args: any[]) => {
          if (!isAll && tenantId && args.length > 0) {
            let payload = args[0];
            if (Array.isArray(payload)) {
              payload = payload.map((p: Record<string, unknown>) => ({ ...p, tenant_id: tenantId }));
            } else if (payload && typeof payload === "object") {
              payload = { ...payload, tenant_id: tenantId };
            }
            args[0] = payload;
          }
          return origMethod.apply(target, args);
        };
      }

      if (prop === "update" || prop === "delete") {
        return (...args: any[]) => {
          let chain = origMethod.apply(target, args);
          if (!isAll && tenantId) {
            chain = chain.eq("tenant_id", tenantId);
          }
          return chain;
        };
      }

      // Chain integrity: preserve the original method bindings
      return origMethod.bind(target);
    },
  }) as typeof builder;
}

export function getScopedRevenueClient(
  supabase: AuthContext["supabase"],
  tenantId: string | undefined
) {
  return {
    deals: () => createScopedProxy(supabase, "crm_deals_v3", tenantId),
    commissions: () => createScopedProxy(supabase, "crm_deal_commissions_v3", tenantId),
    leads: () => createScopedProxy(supabase, "crm_leads_v3", tenantId),
    properties: () => createScopedProxy(supabase, "properties_core", tenantId),

    /**
     * Scoped RPC wrapper
     */
    rpc: <K extends keyof Database["public"]["Functions"]>(
      name: K,
      args: Database["public"]["Functions"][K]["Args"] = {} as Database["public"]["Functions"][K]["Args"]
    ) => {
      // @ts-expect-error - TS2590: Supabase rpc union type is too complex for generic K spread
      return supabase.rpc(name, { ...args, p_tenant_id: tenantId });
    },

    tenantId,
    raw: supabase,
  };
}
