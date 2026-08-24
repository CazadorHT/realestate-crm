"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { CreateContractDialog } from "./CreateContractDialog";
import { StatsTimeFilter } from "@/components/dashboard/StatsTimeFilter";
import { ContractStats } from "./ContractStats";
import { ContractsTable } from "./ContractsTable";
import { TableFooterStats } from "@/components/dashboard/TableFooterStats";
import { getContractStatus } from "../utils";
import { RentalContractWithRelations } from "../types";
import { useLanguage } from "@/lib/i18n/language-context";

interface ContractsPageViewProps {
  contracts: RentalContractWithRelations[];
  totalCount: number;
  timeRange: string;
}

export function ContractsPageView({
  contracts,
  totalCount,
  timeRange,
}: ContractsPageViewProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const expiringSoonContracts = contracts.filter(
    (c) => getContractStatus(c.end_date).status === "expiring-soon"
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Premium Header */}
      <PageHeader
        title={isEn ? "Rental Contracts" : "สัญญาเช่า"}
        subtitle={
          isEn
            ? "Manage and track all lease and rental agreements"
            : "จัดการและติดตามสัญญาเช่าทั้งหมด"
        }
        icon="fileText"
        gradient="emerald"
        breadcrumbs={[
          { label: isEn ? "Dashboard" : "แดชบอร์ด", href: "/protected" },
          { label: isEn ? "Rental Contracts" : "สัญญาเช่า" },
        ]}
        actionSlot={<CreateContractDialog />}
      />

      {/* Time Filter for Stats */}
      <StatsTimeFilter />

      {/* Statistics Cards */}
      <ContractStats contracts={contracts} />

      {/* Contracts Table */}
      <ContractsTable
        contracts={contracts}
        totalCount={totalCount}
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
    </div>
  );
}
