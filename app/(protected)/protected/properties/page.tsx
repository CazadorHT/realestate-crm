import { Metadata } from "next";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import {
  getPropertiesDashboardStatsQuery,
  getPropertiesTableData,
} from "@/features/properties/queries";
import { PropertiesHeader } from "./_components/PropertiesHeader";
import { PropertiesEmptyState } from "./_components/PropertiesEmptyState";
import { PropertyFilters } from "@/components/properties/PropertyFilters";
import { PaginationControls } from "@/components/ui/pagination-controls";

export const metadata: Metadata = {
  title: "จัดการทรัพย์",
  description: "จัดการ เพิ่ม แก้ไข และติดตามอสังหาริมทรัพย์ทั้งหมดในระบบ",
};

const PropertiesTable = dynamic(
  () =>
    import("@/components/properties/PropertiesTable").then(
      (mod) => mod.PropertiesTable,
    ),
  {
    loading: () => (
      <div className="h-96 animate-pulse bg-slate-100 rounded-xl" />
    ),
  },
);

const PropertiesDashboard = dynamic(
  () =>
    import("@/components/properties/PropertiesDashboard").then(
      (mod) => mod.PropertiesDashboard,
    ),
  {
    loading: () => (
      <div className="h-32 animate-pulse bg-slate-100 rounded-xl" />
    ),
  },
);

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
    listing?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    bathrooms?: string;
    province?: string;
    district?: string;
    popular_area?: string;
    sortBy?: string;
    sortOrder?: string;
    nearTransit?: string;
    petFriendly?: string;
    fullyFurnished?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const PAGE_SIZE = 10;
  const currentPage = Number(params.page) || 1;

  // 1. Fetch Data via Refactored Query
  const { tableData, count, filterMetadata } =
    await getPropertiesTableData(params);
  const stats = await getPropertiesDashboardStatsQuery();

  // Redirect if page is empty and not on first page
  if (tableData.length === 0 && currentPage > 1) {
    redirect("/protected/properties?page=1");
  }

  const isEmptyState = tableData.length === 0 && currentPage === 1;

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <PropertiesHeader count={count} />

      <PropertiesDashboard stats={stats} />

      <div id="table" className="space-y-4 scroll-mt-4">
        {/* Section Title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-indigo-500 rounded-lg blur-sm opacity-50" />
            <div className="relative w-1.5 h-8 bg-linear-to-b from-blue-500 to-indigo-600 rounded-full" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              รายการทรัพย์สิน
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              คลิกที่แถวเพื่อดูรายละเอียดหรือแก้ไข
            </p>
          </div>
        </div>

        <PropertyFilters totalCount={count} filterMetadata={filterMetadata} />

        {isEmptyState ? (
          <PropertiesEmptyState />
        ) : (
          <>
            <PropertiesTable data={tableData} />
            <PaginationControls
              totalCount={count}
              pageSize={PAGE_SIZE}
              currentPage={currentPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
