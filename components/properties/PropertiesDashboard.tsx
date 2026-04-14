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

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  CONDO: { label: "คอนโด", color: "#3b82f6" }, // Blue
  HOUSE: { label: "บ้านเดี่ยว", color: "#10b981" }, // Green
  TOWNHOME: { label: "ทาวน์โฮม", color: "#f59e0b" }, // Amber
  VILLA: { label: "วิลล่า", color: "#f43f5e" }, // Rose
  POOL_VILLA: { label: "พูลวิลล่า", color: "#06b6d4" }, // Cyan
  OFFICE_BUILDING: { label: "สำนักงานออฟฟิศ", color: "#0ea5e9" }, // Sky
  LAND: { label: "ที่ดิน", color: "#8b5cf6" }, // Purple
  COMMERCIAL_BUILDING: { label: "อาคารพาณิชย์", color: "#6366f1" }, // Indigo
  WAREHOUSE: { label: "โกดัง", color: "#f97316" }, // Orange
  OTHER: { label: "อื่น ๆ", color: "#64748b" }, // Slate
  Unknown: { label: "ไม่ระบุ", color: "#cbd5e1" }, // Gray
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "ว่าง (Active)", color: "#10b981" }, // Green
  AVAILABLE: { label: "ว่าง (Active)", color: "#10b981" }, // Green (Fallback)
  SOLD: { label: "ขายแล้ว (Sold)", color: "#ef4444" }, // Red
  RENTED: { label: "เช่าแล้ว (Rented)", color: "#3b82f6" }, // Blue
  RESERVED: { label: "จองแล้ว (Reserved)", color: "#f59e0b" }, // Amber
  Biocked: { label: "ระงับชั่วคราว", color: "#6b7280" },
  DRAFT: { label: "ร่าง (Draft)", color: "#fcd34d" }, // Yellow
  CLOSED: { label: "ปิดการขาย", color: "#64748b" }, // Slate
  Unknown: { label: "ไม่ระบุ", color: "#cbd5e1" },
};

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
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to get config safely
  const getTypeConfig = (key: string) =>
    TYPE_CONFIG[key] || {
      label: key,
      color: DEFAULT_COLORS[key.length % DEFAULT_COLORS.length],
    };

  const getStatusConfig = (key: string) =>
    STATUS_CONFIG[key] || {
      label: key,
      color: DEFAULT_COLORS[key.length % DEFAULT_COLORS.length],
    };

  // Transform data for charts
  const typeData = stats.byType
    .map((item) => {
      const config = getTypeConfig(item.name);
      return {
        id: item.name, // keep original key for filtering
        name: config.label,
        value: item.value,
        color: config.color,
      };
    })
    .sort((a, b) => b.value - a.value); // Sort descending

  const statusData = stats.byStatus
    .map((item) => {
      const config = getStatusConfig(item.name);
      return {
        id: item.name === "AVAILABLE" ? "ACTIVE" : item.name, // Normalize
        name: config.label,
        value: item.value,
        color: config.color,
      };
    })
    .sort((a, b) => b.value - a.value);

  // Interaction Handlers
  const handleTypeClick = (data: any) => {
    // Recharts onClick payload can be complex, usually contains the payload data
    if (data && data.id) {
      router.push(`/protected/properties?type=${data.id}`);
    } else if (data && data.payload && data.payload.id) {
      router.push(`/protected/properties?type=${data.payload.id}`);
    }
  };

  const handleStatusClick = (data: any) => {
    if (data && data.id) {
      router.push(`/protected/properties?status=${data.id}`);
    } else if (data && data.activePayload && data.activePayload[0]) {
      // Bar chart might pass different structure
      const id = data.activePayload[0].payload.id;
      if (id) router.push(`/protected/properties?status=${id}`);
    }
  };


  return (
    <div className="space-y-4 md:space-y-6 mb-8 mt-2">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground line-clamp-1">
              ทรัพย์ทั้งหมด
            </CardTitle>
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg shrink-0">
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
              รายการในระบบ
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground line-clamp-1">
              ประกาศ Active
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
              กำลังประกาศขาย/เช่า
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground line-clamp-1">
              คอมมิชชั่นปิดได้
            </CardTitle>
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">
              {new Intl.NumberFormat("th-TH", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(stats.totalRealizedCommission || 0)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
              บาท (Sold & Rented)
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-default">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground line-clamp-1">
              คาดการณ์คอมฯ
            </CardTitle>
            <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg shrink-0">
              <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-[11px] text-muted-foreground uppercase font-bold shrink-0">
                  ขาย
                </span>
                <span className="text-sm sm:text-lg font-bold text-amber-600 truncate">
                  {new Intl.NumberFormat("th-TH", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(stats.totalSaleCommission || 0)}
                </span>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-[11px] text-muted-foreground uppercase font-bold shrink-0">
                  เช่า
                </span>
                <span className="text-sm sm:text-lg font-bold text-blue-600 truncate">
                  {new Intl.NumberFormat("th-TH", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(stats.totalRentCommission || 0)}
                </span>
              </div>
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
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
