import { SuccessAnimation } from "@/components/settings/SuccessAnimation";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { ContractsTable } from "@/features/contracts/components/ContractsTable";
import { CreateContractDialog } from "@/features/contracts/components/CreateContractDialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ContractStats } from "@/features/contracts/components/ContractStats";
import { getContractStatus } from "@/features/contracts/utils";
import { RentalContractWithRelations } from "@/features/contracts/types";
import { TableFooterStats } from "@/components/dashboard/TableFooterStats";

import { getContracts } from "@/features/contracts/queries";
import { mapDbError } from "@/lib/db-error";
import { StatsTimeFilter } from "../../../../components/dashboard/StatsTimeFilter";
import { Suspense } from "react";
import { cookies } from "next/headers";

interface RentalContractsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RentalContractsPage({
  searchParams,
}: RentalContractsPageProps) {
  const { role, tenantId } = await requireAuthContext();
  assertStaff(role);

  const cookieStore = await cookies();
  const lang = (cookieStore.get("crm-language")?.value || cookieStore.get("language")?.value || "th") as "th" | "en";
  const isEn = lang === "en";

  const params = await searchParams;
  const timeRange = (params.timeRange as string) || "all";

  return (
    <div className="space-y-6 animate-fade-in">
      <SuccessAnimation />
      {/* Premium Header */}
      <PageHeader
        title={isEn ? "Rental Contracts" : "สัญญาเช่า (Contracts)"}
        subtitle={isEn ? "Manage and track all lease and rental agreements" : "จัดการและติดตามสัญญาเช่าทั้งหมด"}
        icon="fileText"
        gradient="emerald"
        actionSlot={<CreateContractDialog />}
      />

      {/* Time Filter for Stats */}
      <StatsTimeFilter />

      {/* 🚀 STREAMED CONTENT */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-slate-50 rounded-2xl" />}>
        <ContractsContentSection 
          tenantId={tenantId}
          timeRange={timeRange}
          isEn={isEn}
        />
      </Suspense>
    </div>
  );
}

/** 🚀 CONTRACTS PERFORMANCE WRAPPER */

async function ContractsContentSection({
  tenantId,
  timeRange,
  isEn,
}: {
  tenantId: string | undefined;
  timeRange: string;
  isEn: boolean;
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
  const expiringSoonContracts = contracts.filter(
    (c) => getContractStatus(c.end_date).status === "expiring-soon"
  ).length;

  return (
    <>
      {/* Statistics Cards */}
      <ContractStats contracts={contracts} />

      {/* Contracts Table */}
      <ContractsTable
        contracts={contracts}
        totalCount={count}
        filters={{ timeRange }}
      />

      {/* Quick Stats Footer */}
      {contracts.length > 0 && (
        <TableFooterStats
          totalCount={contracts.length}
          unitLabel={isEn ? "contracts" : "สัญญา"}
          secondaryStats={
            expiringSoonContracts > 0
              ? [
                  {
                    label: isEn ? "Expiring Soon" : "สัญญาใกล้หมดอายุ",
                    value: expiringSoonContracts,
                    color: "orange",
                    icon: "clock",
                  },
                ]
              : []
          }
        />
      )}
    </>
  );
}


