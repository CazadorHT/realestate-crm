import { Metadata } from "next";
import { getDeals } from "@/features/deals/queries.getDeals";
import { getPropertiesForSelect } from "@/features/properties/queries/search";
import { getDealsPageStats } from "@/features/deals/queries";
import { DealsTable } from "@/features/deals/DealsTable";
import { CreateDealButton } from "./_components/CreateDealButton";
import { StatsTimeFilter } from "../../../../components/dashboard/StatsTimeFilter";
import { requireAuthContext } from "@/lib/authz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Handshake,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
} from "lucide-react";
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { DealsFinancialsTour } from "@/features/deals/_components/DealsFinancialsTour";
import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { cookies } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("crm-language")?.value || cookieStore.get("language")?.value || "th") as "th" | "en";
  const isEn = lang === "en";
  return {
    title: isEn ? "Deals" : "การจัดการดีล",
  };
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ timeRange?: string; page?: string }>;
}) {
  const { timeRange = "all", page: spPage } = await searchParams;
  const currentPage = Number(spPage) || 1;

  const cookieStore = await cookies();
  const lang = (cookieStore.get("crm-language")?.value || cookieStore.get("language")?.value || "th") as "th" | "en";
  const isEn = lang === "en";

  // [PERFORMANCE] Parallel Fetching: Core Auth & Global Pre-fetches
  const [authContext, properties] = await Promise.all([
    requireAuthContext(),
    getPropertiesForSelect(),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <DealsFinancialsTour />
      {/* 🚀 1. HEADER (Static with fast context) */}
      <PageHeader
        title={isEn ? "Deals" : "การจัดการดีล"}
        subtitle={isEn ? "Track and manage sales and rental deals" : "จัดการและติดตามดีลการขายและเช่า"}
        icon="handshake"
        gradient="amber"
        actionSlot={<CreateDealButton properties={properties} />}
      />

      {/* Time Filter for Stats */}
      <StatsTimeFilter />

      {/* 🚀 2. STATS SECTION (Streamed) */}
      <Suspense fallback={<div className="h-32 animate-pulse bg-slate-50 rounded-2xl" />}>
        <DealsStatsSection timeRange={timeRange} isEn={isEn} />
      </Suspense>

      {/* 🚀 3. MAIN CONTENT (Streamed) */}
      <Suspense fallback={<div className="h-[60vh] animate-pulse bg-slate-50 rounded-2xl" />}>
        <DealsContentSection 
          currentPage={currentPage} 
          timeRange={timeRange} 
          properties={properties}
          isEn={isEn}
        />
      </Suspense>
    </div>
  );
}

/** 🚀 DEALS PERFORMANCE WRAPPERS */

async function DealsStatsSection({ timeRange, isEn }: { timeRange: string; isEn: boolean }) {
  const dealsStats = await getDealsPageStats(timeRange);
  const { totalDeals, activeDeals, wonDeals, lostDeals, totalCommission, netCommission } = dealsStats;

  return (
    <>
      <div id="tour-deals-stats" className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isEn ? "Total Deals" : "ดีลทั้งหมด"}</CardTitle>
            <Handshake className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeals}</div>
            <p className="text-xs text-slate-500 mt-1">{isEn ? "Total deals" : "ดีลทั้งหมด"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isEn ? "In Progress" : "กำลังดำเนินการ"}</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeDeals}</div>
            <p className="text-xs text-slate-500 mt-1">{isEn ? "Active deals" : "กำลังดำเนินการ"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isEn ? "Closed Won" : "ปิดการขาย"}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{wonDeals}</div>
            <p className="text-xs text-slate-500 mt-1">{isEn ? "Won deals" : "สำเร็จ"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isEn ? "Cancelled / Lost" : "ยกเลิก"}</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lostDeals}</div>
            <p className="text-xs text-slate-500 mt-1">{isEn ? "Lost deals" : "ยกเลิก"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isEn ? "Gross Commission" : "ค่าคอมมิชชันรวม (ก่อนหัก Co-Broker)"}</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {new Intl.NumberFormat(isEn ? "en-US" : "th-TH", {
                notation: "compact",
                compactDisplay: "short",
                maximumFractionDigits: 1,
              }).format(totalCommission)}
            </div>
            <p className="text-xs text-slate-500 mt-1">{isEn ? "Before co-broker" : "ก่อนหัก Co-Broker"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isEn ? "Net Commission" : "ค่าคอมมิชชันสุทธิ (หลังหัก Co-Broker)"}</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {new Intl.NumberFormat(isEn ? "en-US" : "th-TH", {
                notation: "compact",
                compactDisplay: "short",
                maximumFractionDigits: 1,
              }).format(netCommission || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">{isEn ? "After co-broker" : "หลังหัก Co-Broker"}</p>
          </CardContent>
        </Card>
      </div>

      {totalDeals > 0 && (
        <div className="mt-6">
          <Card className="bg-linear-to-r from-blue-50 to-purple-50 border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Win Rate</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {((wonDeals / totalDeals) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">
                    {wonDeals} {isEn ? "Won" : "สำเร็จ"} / {lostDeals} {isEn ? "Lost" : "ยกเลิก"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{isEn ? `Out of ${totalDeals} deals` : `จากทั้งหมด ${totalDeals} ดีล`}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

async function DealsContentSection({
  currentPage,
  timeRange,
  properties,
  isEn,
}: {
  currentPage: number;
  timeRange: string;
  properties: any;
  isEn: boolean;
}) {
  const [{ data, count }, stats] = await Promise.all([
    getDeals({ page: currentPage, pageSize: 20, timeRange }),
    getDealsPageStats(timeRange), // We need this for the empty state check and additional labels
  ]);

  if (stats.totalDeals === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          icon="handshake"
          title={isEn ? "No Deals in System" : "ยังไม่มีดีลในระบบ"}
          description={isEn ? "Start by creating your first deal to track sales or rental pipeline." : "เริ่มต้นสร้างดีลแรกของคุณเพื่อติดตามความคืบหน้าการขายหรือเช่า"}
          actionSlot={<CreateDealButton properties={properties} />}
        />
      </div>
    );
  }

  return (
    <>
      {/* Deals Table */}
      <div className="space-y-4 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{isEn ? "All Deals" : "รายการดีลทั้งหมด"}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {isEn ? `Showing ${data.length} of ${count} deals` : `แสดง ${data.length} จาก ${count} ดีล`}
            </p>
          </div>
          {stats.activeDeals > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">{stats.activeDeals} {isEn ? "In Progress" : "รอดำเนินการ"}</span>
            </div>
          )}
        </div>

        <div id="tour-deals-table" className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-4">
          <DealsTable
            initialData={data}
            initialCount={count}
            initialPage={currentPage}
            pageSize={20}
            properties={properties}
            timeRange={timeRange}
          />
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-slate-500 px-2 mt-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-medium text-slate-700">{isEn ? `Total ${stats.totalDeals} deals` : `แสดงทั้งหมด ${stats.totalDeals} ดีล`}</span>
          {stats.activeDeals > 0 && (
            <span className="flex items-center gap-1 text-blue-600 font-medium whitespace-nowrap">
              <Clock className="h-4 w-4" />
              {stats.activeDeals} {isEn ? "In Progress" : "กำลังดำเนินการ"}
            </span>
          )}
          {stats.wonDeals > 0 && (
            <span className="text-green-600 font-medium whitespace-nowrap">{stats.wonDeals} {isEn ? "Won" : "สำเร็จ"}</span>
          )}
        </div>
        <div className="text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
          <p className="text-xs">{isEn ? `Last updated: ${new Date().toLocaleDateString("en-US")}` : `อัพเดทล่าสุด: ${new Date().toLocaleDateString("th-TH")}`}</p>
        </div>
      </div>
    </>
  );
}



