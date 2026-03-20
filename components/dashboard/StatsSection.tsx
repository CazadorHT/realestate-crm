import { Suspense } from "react";
import { getDashboardStats } from "@/features/dashboard/queries";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { StatsSkeleton } from "./skeletons/StatsSkeleton";

export async function StatsSection({ tenantId }: { tenantId?: string | null }) {
  const stats = await getDashboardStats(tenantId);
  return <StatsOverview initialStats={stats} />;
}

export function StatsSectionSuspense({ tenantId }: { tenantId?: string | null }) {
  return (
    <Suspense fallback={<StatsSkeleton />}>
      <StatsSection tenantId={tenantId} />
    </Suspense>
  );
}
