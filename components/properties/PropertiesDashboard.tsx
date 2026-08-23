"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Home,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Coins,
} from "lucide-react";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useLanguage } from "@/components/providers/LanguageProvider";

const PropertyDistributionCharts = dynamic(
  () => import("@/features/properties/components/PropertyDistributionCharts"),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[400px] bg-slate-50/50 animate-pulse rounded-xl" />
        <div className="h-[400px] bg-slate-50/50 animate-pulse rounded-xl" />
      </div>
    ),
  },
);
import type { PropertyStats } from "@/features/properties/queries/types";
import { useRouter } from "next/navigation";

// --- Configuration Maps ---

const getTypeConfigMap = (isEn: boolean): Record<string, { label: string; color: string }> => ({
  CONDO: { label: isEn ? "Condo" : "คอนโด", color: "#3b82f6" },
  HOUSE: { label: isEn ? "House" : "บ้านเดี่ยว", color: "#10b981" },
  TOWNHOME: { label: isEn ? "Townhome" : "ทาวน์โฮม", color: "#f59e0b" },
  VILLA: { label: isEn ? "Villa" : "วิลล่า", color: "#f43f5e" },
  POOL_VILLA: { label: isEn ? "Pool Villa" : "พูลวิลล่า", color: "#06b6d4" },
  OFFICE_BUILDING: { label: isEn ? "Office" : "สำนักงานออฟฟิศ", color: "#0ea5e9" },
  LAND: { label: isEn ? "Land" : "ที่ดิน", color: "#8b5cf6" },
  COMMERCIAL_BUILDING: { label: isEn ? "Commercial" : "อาคารพาณิชย์", color: "#6366f1" },
  WAREHOUSE: { label: isEn ? "Warehouse" : "โกดัง", color: "#f97316" },
  OTHER: { label: isEn ? "Other" : "อื่น ๆ", color: "#64748b" },
  Unknown: { label: isEn ? "Unknown" : "ไม่ระบุ", color: "#cbd5e1" },
});

const getStatusConfigMap = (isEn: boolean): Record<string, { label: string; color: string }> => ({
  ACTIVE: { label: isEn ? "Active" : "ว่าง (Active)", color: "#10b981" },
  AVAILABLE: { label: isEn ? "Active" : "ว่าง (Active)", color: "#10b981" },
  UNDER_OFFER: { label: isEn ? "Under Offer" : "ติดจอง (Offer)", color: "#f59e0b" },
  RESERVED: { label: isEn ? "Reserved" : "จองแล้ว (Reserved)", color: "#f59e0b" },
  SOLD: { label: isEn ? "Sold" : "ขายแล้ว (Sold)", color: "#ef4444" },
  RENTED: { label: isEn ? "Rented" : "เช่าแล้ว (Rented)", color: "#3b82f6" },
  DRAFT: { label: isEn ? "Draft" : "ร่าง (Draft)", color: "#fcd34d" },
  ARCHIVED: { label: isEn ? "Archived" : "ยกเลิก (Archived)", color: "#64748b" },
  BLOCKED: { label: isEn ? "Suspended" : "ระงับชั่วคราว", color: "#6b7280" },
  CLOSED: { label: isEn ? "Closed" : "ปิดการขาย", color: "#64748b" },
  Unknown: { label: isEn ? "Unknown" : "ไม่ระบุ", color: "#cbd5e1" },
});

// Fallback color palette
const DEFAULT_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#64748b",
];

interface PropertiesDashboardProps {
  stats: PropertyStats;
}

export function PropertiesDashboard({ stats }: PropertiesDashboardProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const isEn = language === "en";
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const typeConfig = getTypeConfigMap(isEn);
  const statusConfig = getStatusConfigMap(isEn);

  // Helper to get config safely
  const getTypeConfig = (key: string) =>
    typeConfig[key] || {
      label: key,
      color: DEFAULT_COLORS[key.length % DEFAULT_COLORS.length],
    };

  const getStatusConfig = (key: string) =>
    statusConfig[key] || {
      label: key,
      color: DEFAULT_COLORS[key.length % DEFAULT_COLORS.length],
    };

  // Transform data for charts
  const typeData = stats.byType
    .map((item) => {
      const config = getTypeConfig(item.name);
      return {
        id: item.name,
        name: config.label,
        value: item.value,
        color: config.color,
      };
    })
    .sort((a, b) => b.value - a.value);

  const statusData = stats.byStatus
    .map((item) => {
      const config = getStatusConfig(item.name);
      return {
        id: item.name,
        name: config.label,
        value: item.value,
        color: config.color,
      };
    })
    .sort((a, b) => b.value - a.value);

  const handleTypeClick = (data: any) => {
    if (data && data.id) {
      router.push(`/protected/properties?property_type=${data.id}`);
    }
  };

  const handleStatusClick = (data: any) => {
    if (data && data.id) {
      router.push(`/protected/properties?status=${data.id}`);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 mb-8 mt-2">

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground line-clamp-1">
              {isEn ? "Total Properties" : "ทรัพย์ทั้งหมด"}
            </CardTitle>
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg shrink-0">
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
              {isEn ? "Listings in system" : "รายการในระบบ"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground line-clamp-1">
              {isEn ? "Active Listings" : "ประกาศ Active"}
            </CardTitle>
            <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg shrink-0">
              <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-emerald-600">
              {stats.available}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
              {isEn ? "Currently on market" : "กำลังประกาศขาย/เช่า"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground line-clamp-1">
              {isEn ? "Realized Commission" : "คอมมิชชั่นปิดได้"}
            </CardTitle>
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">
              {new Intl.NumberFormat(isEn ? "en-US" : "th-TH", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(stats.totalRealizedCommission || 0)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
              {isEn ? "THB (Sold & Rented)" : "บาท (Sold & Rented)"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground line-clamp-1">
              {isEn ? "Net Commission" : "ค่าคอมฯ สุทธิปิดได้"}
            </CardTitle>
            <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg shrink-0">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-indigo-600">
              {new Intl.NumberFormat(isEn ? "en-US" : "th-TH", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(stats.totalNetRealizedCommission || 0)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
              {isEn ? "Net revenue" : "รายได้สุทธิบริษัท"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground line-clamp-1">
              {isEn ? "Inventory Value" : "มูลค่าทรัพย์รวม"}
            </CardTitle>
            <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg shrink-0">
              <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-[11px] text-muted-foreground uppercase font-bold shrink-0">
                  {isEn ? "Sale (Net)" : "ขาย (สุทธิ)"}
                </span>
                <span className="text-sm sm:text-lg font-bold text-amber-600 truncate">
                  {new Intl.NumberFormat(isEn ? "en-US" : "th-TH", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(stats.totalNetSaleCommission || 0)}
                </span>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-[11px] text-muted-foreground uppercase font-bold shrink-0">
                  {isEn ? "Rent" : "เช่า"}
                </span>
                <span className="text-sm sm:text-lg font-bold text-blue-600 truncate">
                  {new Intl.NumberFormat(isEn ? "en-US" : "th-TH", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(stats.totalRentCommission || 0)}
                </span>
              </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      {mounted && (
        <ErrorBoundary>
          <PropertyDistributionCharts
            typeData={typeData}
            statusData={statusData}
            handleTypeClick={handleTypeClick}
            handleStatusClick={handleStatusClick}
            isEn={isEn}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
