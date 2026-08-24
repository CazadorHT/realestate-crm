import { SuccessAnimation } from "@/components/settings/SuccessAnimation";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { ContractsPageView } from "@/features/contracts/components/ContractsPageView";
import { RentalContractWithRelations } from "@/features/contracts/types";
import { getContracts } from "@/features/contracts/queries";
import { mapDbError } from "@/lib/db-error";
import { Suspense } from "react";

interface RentalContractsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RentalContractsPage({
  searchParams,
}: RentalContractsPageProps) {
  const { role, tenantId } = await requireAuthContext();
  assertStaff(role);

  const params = await searchParams;
  const timeRange = (params.timeRange as string) || "all";

  return (
    <>
      <SuccessAnimation />
      <Suspense fallback={<div className="h-96 animate-pulse bg-slate-50 rounded-2xl" />}>
        <ContractsContentSection 
          tenantId={tenantId}
          timeRange={timeRange}
        />
      </Suspense>
    </>
  );
}

/** 🚀 CONTRACTS PERFORMANCE WRAPPER */

async function ContractsContentSection({
  tenantId,
  timeRange,
}: {
  tenantId: string | undefined;
  timeRange: string;
}) {
  const { data, count, error } = await getContracts({
    tenantId,
    timeRange,
  });

  if (error) {
    return (
      <div className="p-8 text-red-500">
        Error loading contracts: {mapDbError(error)}
      </div>
    );
  }

  const contracts = (data as unknown as RentalContractWithRelations[]) || [];

  return (
    <ContractsPageView
      contracts={contracts}
      totalCount={count || 0}
      timeRange={timeRange}
    />
  );
}



