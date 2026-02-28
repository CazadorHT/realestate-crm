"use client";

import { useTenant } from "@/components/providers/TenantProvider";

export function DynamicTenantName({ fallback }: { fallback: string }) {
  const { activeTenant } = useTenant();
  return <>{activeTenant?.name || fallback}</>;
}
