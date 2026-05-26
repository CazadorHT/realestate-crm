import { Suspense } from "react";
import { PartnersContent } from "@/features/admin/components/PartnersContent";
import { requireAuthContext } from "@/lib/authz";
import { getSiteSettings } from "@/features/site-settings/actions";
import { getPartners } from "@/features/admin/partners-actions";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const [authContext, settings, partnersRes] = await Promise.all([
    requireAuthContext(),
    getSiteSettings(),
    getPartners({ page: 1, pageSize: 100 })
  ]);

  const { role } = authContext;
  const isSuperAdmin = role === "ADMIN";
  const partners = partnersRes.success ? partnersRes.data : [];

  return (
    <Suspense fallback={
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    }>
      <PartnersContent 
        isSuperAdmin={isSuperAdmin} 
        settings={settings}
        initialPartners={partners}
      />
    </Suspense>
  );
}
