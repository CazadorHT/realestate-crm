"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  getGlobalPropertiesTableDataAction,
  getGlobalInventoryFilterCountsAction 
} from "@/features/properties/actions";
import { getTenantsAction } from "@/lib/actions/tenant-management";
import { toast } from "sonner";

// 🛡️ Standardized Elite UI
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PaginationControls } from "@/components/ui/pagination-controls";

// 🛡️ Elite Modular Components
import { InventoryStats } from "./components/InventoryStats";
import { InventoryFilters } from "./components/InventoryFilters";
import { InventoryTable } from "./components/InventoryTable";
import { InventoryProperty, InventoryFilterCounts } from "./types";

export default function GlobalInventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const page = Number(searchParams.get("page")) || 1;
  const query = searchParams.get("q") || "";
  const propertyType = searchParams.get("type") || "ALL";
  const listingType = searchParams.get("listing") || "ALL";
  const status = searchParams.get("status") || "ALL";
  const targetTenantId = searchParams.get("tenant") || "ALL";

  const [data, setData] = useState<InventoryProperty[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [filterCounts, setFilterCounts] = useState<InventoryFilterCounts | undefined>();

  const fetchTenants = async () => {
    try {
      const res = await getTenantsAction();
      if (res.data) setTenants(res.data);
    } catch (error) {
      console.error("fetchTenants error:", error);
    }
  };

  const fetchFilterCounts = async () => {
    try {
      const res = await getGlobalInventoryFilterCountsAction();
      setFilterCounts(res);
    } catch (error) {
      console.error("fetchFilterCounts error:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getGlobalPropertiesTableDataAction({
        page,
        q: query,
        propertyType,
        listingType,
        status,
        targetTenantId,
      });
      setData(result.tableData as InventoryProperty[]);
      setCount(result.count);
    } catch (error) {
      toast.error("ไม่สามารถดึงข้อมูลคลังทรัพย์สินรวมได้");
    } finally {
      // 🛡️ Smooth UX Transition delay
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchTenants();
    fetchFilterCounts();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, query, propertyType, listingType, status, targetTenantId]);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "ALL" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    if (!updates.page) params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const resetFilters = () => {
    router.push(pathname);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* 🛡️ Standardized Elite Header */}
      <PageHeader
        title="คลังทรัพย์สินรวม (Global Inventory)"
        subtitle="ศูนย์รวมข้อมูลอสังหาริมทรัพย์จากทุกสาขา เพื่อการทำงานแบบไร้พรมแดน"
        icon="layers"
        gradient="blue"
        breadcrumbs={[
          { label: "หน้าแรก", href: "/protected" },
          { label: "ผู้ดูแลระบบ", href: "/protected/admin/analytics" },
          { label: "คลังทรัพย์สินรวม" }
        ]}
      />

      <div className="max-w-screen-2xl mx-auto space-y-8">
        {/* 🚀 Layer 1: Intelligence Stats (Interactive) */}
        <InventoryStats 
          totalCount={count}
          activeCount={data.filter(i => i.status === "ACTIVE").length}
          branchCount={tenants.length}
          isLoading={loading}
          currentStatus={status}
          onFilterClick={(update: Record<string, string | null>) => updateFilters(update)}
        />

        {/* 🔍 Layer 2: Strategic Filters (Debounced & Quick) */}
        <InventoryFilters 
          query={query}
          propertyType={propertyType}
          listingType={listingType}
          status={status}
          tenantId={targetTenantId}
          tenants={tenants}
          filterCounts={filterCounts}
          onFilterChange={updateFilters}
          onReset={resetFilters}
        />

        {/* 🏢 Layer 3: Adaptive Inventory Matrix (Dual-View) */}
        <div className="space-y-6">
          <InventoryTable 
            data={data} 
            isLoading={loading} 
            onReset={resetFilters}
          />

          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs">
            <PaginationControls
              totalCount={count}
              pageSize={10}
              currentPage={page}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
