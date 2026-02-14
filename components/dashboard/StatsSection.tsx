import { Suspense } from "react";
import { getDashboardStats } from "@/features/dashboard/queries";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { StatsSkeleton } from "./skeletons/StatsSkeleton";

export async function StatsSection() {
  const stats = await getDashboardStats();
  return <StatsOverview initialStats={stats} />;
}

export function StatsSectionSuspense() {
  return (
    <Suspense fallback={<StatsSkeleton />}>
      <StatsSection />
    </Suspense>
  );
}
