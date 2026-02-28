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

type Tenant = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  subscription_status: string | null;
  settings?: {
    theme?: {
      primary?: string;
      secondary?: string;
    };
    logo_dark_url?: string | null;
    favicon_url?: string | null;
    [key: string]: any;
  };
  userRole?: string;
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
        return;
      }

      // 1. Fetch all tenants for this user regardless of mode (needed for fallback)
      const { data: memberData, error } = await supabase
        .from("tenant_members")
        .select(
          `
          tenant_id,
          role,
          tenants (
            id,
            name,
            slug,
            logo_url,
            subscription_status,
            settings
          )
        `,
        )
        .eq("profile_id", user.id);

      if (error) throw error;

      const tenantList = memberData
        ?.map((m: any) => ({
          ...m.tenants,
          userRole: m.role,
        }))
        .filter(Boolean) as Tenant[];
      setTenants(tenantList || []);

      // 2. Determine Active Tenant
      if (!config.multi_tenant_enabled) {
        // Single-tenant mode logic
        let initial: Tenant | null = null;

        if (config.default_tenant_id) {
          // Try to find the default tenant in the user's tenant list (to get the role)
          initial =
            tenantList.find((t) => t.id === config.default_tenant_id) || null;

          // If not in user's list (e.g. admin not added yet), fetch it directly
          if (!initial) {
            const { data: defaultTenant } = await supabase
              .from("tenants")
              .select("id, name, slug, logo_url, subscription_status")
              .eq("id", config.default_tenant_id)
              .single();

            if (defaultTenant) {
              initial = defaultTenant as Tenant;
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
          const initial =
            tenantList.find((t) => t.id === storedId) || tenantList[0];
          setActiveTenant(initial);
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
    const selected = tenants.find((t) => t.id === id);
    if (selected) {
      setActiveTenant(selected);
      localStorage.setItem("active_tenant_id", id);

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
