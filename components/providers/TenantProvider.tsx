"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { getSystemConfig } from "@/lib/actions/system-config";
import { setActiveTenantCookieAction } from "@/lib/actions/tenant-context";
import { type Json } from "@/lib/database.types.generated";
import * as Sentry from "@sentry/nextjs";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  userRole: string;
  global_settings?: Record<string, any>;
};

type TenantContextType = {
  activeTenant: Tenant | null;
  tenants: Tenant[];
  isLoading: boolean;
  isMultiTenantEnabled: boolean;
  setTenantId: (id: string) => void;
  refresh: () => Promise<void>;
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isMultiTenantEnabled, setIsMultiTenantEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();
  const router = useRouter();

  const fetchTenantsAndConfig = async () => {
    try {
      setIsLoading(true);
      const config = await getSystemConfig();
      setIsMultiTenantEnabled(config.multi_tenant_enabled);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        Sentry.setUser(null); // 🛡️ ล้างข้อมูลเมื่อ Logout
        return;
      }

      // 🛡️ Identity Linking: เชื่อมต่อตัวตนกับ Sentry
      Sentry.setUser({
        id: user.id,
        email: user.email,
      });

      // 1. Fetch all tenants for this user regardless of mode (needed for fallback)
      const { data: memberData, error } = await supabase
        .from("tenant_members_v3")
        .select(`
          role,
          tenant:tenants_v3 (
            id,
            name,
            slug,
            logo_url,
            global_settings
          )
        `)
        .eq("identity_id", user.id);

      if (error) throw error;

      interface V3TenantMember {
        role: string;
        tenant: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          global_settings: Json | null;
        } | null;
      }

      const tenantList: Tenant[] = ((memberData as unknown as V3TenantMember[]) || [])
        .map((m): Tenant | null => {
          if (!m.tenant) return null;
          return {
            id: m.tenant.id,
            name: m.tenant.name,
            slug: m.tenant.slug,
            logo_url: m.tenant.logo_url,
            userRole: m.role,
            global_settings: m.tenant.global_settings as Record<string, any>,
          };
        })
        .filter((t): t is Tenant => t !== null);

      setTenants(tenantList);

      // 2. Determine Active Tenant
      if (!config.multi_tenant_enabled) {
        // Single-tenant mode logic
        let initial: Tenant | null = null;

        if (config.default_tenant_id) {
          // Try to find the default tenant in the user's tenant list (to get the role)
          initial =
            tenantList.find((t) => t.id === config.default_tenant_id) || null;

          // If not in user's list (e.g. superadmin not explicitly added), fetch it
          if (!initial) {
            const { data: defaultTenant } = await supabase
              .from("tenants_v3")
              .select("id, name, slug, logo_url, global_settings")
              .eq("id", config.default_tenant_id)
              .single();

            if (defaultTenant) {
              initial = {
                ...defaultTenant,
                userRole: "ADMIN", // Fallback for system default
                global_settings: (defaultTenant as any).global_settings as Record<string, any>,
              };
            }
          }
        }

        // Fallback: if still no initial, or no default_tenant_id, use first joined tenant
        if (!initial && tenantList.length > 0) {
          initial = tenantList[0];
        }

        setActiveTenant(initial);
      } else {
        // Multi-tenant mode logic
        if (tenantList && tenantList.length > 0) {
          const storedId = localStorage.getItem("active_tenant_id");
          
          if (storedId === "ALL") {
            setActiveTenant({
              id: "ALL",
              name: "ทุกสาขา (Global View)",
              slug: "all",
              logo_url: null,
              userRole: "ADMIN",
            });
          } else {
            const initial =
              tenantList.find((t) => t.id === storedId) || tenantList[0];
            setActiveTenant(initial);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch tenants/config:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantsAndConfig();
  }, [supabase]);

  const setTenantId = (id: string) => {
    if (id === "ALL") {
      setActiveTenant({
        id: "ALL",
        name: "ทุกสาขา (Global View)",
        slug: "all",
        logo_url: null,
        userRole: "ADMIN",
      });
      localStorage.setItem("active_tenant_id", "ALL");
      setActiveTenantCookieAction("ALL");
      startTransition(() => {
        router.refresh();
      });
      return;
    }

    const selected = tenants.find((t) => t.id === id);
    if (selected) {
      setActiveTenant(selected);
      localStorage.setItem("active_tenant_id", id);
      // Update cookie for server-side state
      setActiveTenantCookieAction(id);
      
      // Optionally refresh valid data or redirect
      startTransition(() => {
        router.refresh();
      });
    }
  };

  return (
    <TenantContext.Provider
      value={{
        activeTenant,
        tenants,
        isLoading: isLoading || isPending,
        isMultiTenantEnabled,
        setTenantId,
        refresh: fetchTenantsAndConfig,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
