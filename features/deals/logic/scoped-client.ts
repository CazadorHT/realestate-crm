import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";
import { AuthContext } from "@/lib/authz";

/**
 * Filter tables that have a tenant_id column for ironclad scoping
 */
type TenantTable = {
  [K in keyof Database["public"]["Tables"]]: Database["public"]["Tables"][K]["Row"] extends {
    tenant_id: string | null;
  }
    ? K
    : never;
}[keyof Database["public"]["Tables"]];
/**
 * The Runtime Proxy Injector (Elite Architecture)
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
              payload = payload.map((p) => ({ ...p, tenant_id: tenantId }));
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
    deals: () => createScopedProxy(supabase, "deals", tenantId),
    commissions: () => createScopedProxy(supabase, "deal_commissions", tenantId),
    leads: () => createScopedProxy(supabase, "leads", tenantId),
    properties: () => createScopedProxy(supabase, "properties", tenantId),

    /**
     * Scoped RPC wrapper
     */
    rpc: <K extends keyof Database["public"]["Functions"]>(
      name: K,
      args: Database["public"]["Functions"][K]["Args"] = {}
    ) => {
      return supabase.rpc(name, { ...args, p_tenant_id: tenantId });
    },

    tenantId,
    raw: supabase,
  };
}
