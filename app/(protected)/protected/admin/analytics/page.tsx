import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { isAdmin } from "@/lib/auth-shared";
import {
  getAnalyticsStats,
  type PropertyAnalytics,
  type AreaAnalytics,
} from "@/features/dashboard/queries";
import { LISTING_TYPE_LABELS } from "@/features/properties/labels";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  Eye,
  TrendingUp,
  MapPin,
  ArrowUpRight,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AnalyticsFilters } from "./components/AnalyticsFilters";
import { ResetViewsButton } from "./components/ResetViewsButton";

export default async function AnalyticsPage(props: {
  searchParams: Promise<{ range?: string }>;
}) {
  const searchParams = await props.searchParams;
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) {
    return redirect("/protected");
  }

  const range = searchParams.range;
  const days = range && range !== "all" ? parseInt(range) : undefined;
  const { topProperties, topAreas, totalViews } = await getAnalyticsStats(days);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-medium tracking-tight text-slate-900">
            ข้อมูลวิเคราะห์ (Analytics)
          </h1>
          <p className="text-sm md:text-base text-slate-500">
            ภาพรวมการเข้าชมทรัพย์สินและแนวโน้มตลาดย่านต่างๆ
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto self-end">
          <AnalyticsFilters />
          <ResetViewsButton />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="border-none shadow-sm bg-linear-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-100 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              ยอดเข้าชมรวม (Top 10)
            </CardDescription>
            <CardTitle className="text-3xl md:text-4xl font-semibold">
              {totalViews.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-blue-100/80 uppercase tracking-wider">
              อัปเดตแบบ Real-time
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              ย่านยอดนิยม
            </CardDescription>
            <CardTitle className="text-xl md:text-2xl font-medium truncate">
              {topAreas[0]?.name || "ไม่มีข้อมูล"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              {topAreas[0]?.view_count
                ? `${topAreas[0].view_count.toLocaleString()} Views`
                : "-"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-orange-500" />
              ทรัพย์ที่ถูกเปิดดูมากที่สุด
            </CardDescription>
            <CardTitle className="text-lg md:text-xl font-medium line-clamp-1">
              {topProperties[0]?.title || "ไม่มีข้อมูล"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              {topProperties[0]?.view_count
                ? `${topProperties[0].view_count.toLocaleString()} Views`
                : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Top Properties Table */}
        <Card className="border-none shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 md:p-6">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">
                  ทรัพย์ที่มีการเข้าชมสูงสุด
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  จัดอันดับตามจำนวนการเปิดดู (Views)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] md:text-xs text-slate-500 uppercase bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="px-4 md:px-6 py-3 md:py-4 font-semibold whitespace-nowrap">
                      ทรัพย์สิน
                    </th>
                    <th className="hidden md:table-cell px-6 py-4 font-semibold">
                      ประเภท
                    </th>
                    <th className="px-4 md:px-6 py-3 md:py-4 font-semibold text-right">
                      จำนวนวิว
                    </th>
                    <th className="px-4 md:px-6 py-3 md:py-4 font-semibold text-right">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProperties.map((prop: PropertyAnalytics, idx: number) => (
                    <tr
                      key={prop.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="flex flex-col min-w-[150px] max-w-[250px]">
                          <span className="font-normal  text-slate-900 truncate">
                            {prop.title}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-tighter">
                            {prop.id.slice(0, 8)}
                          </span>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap",
                            prop.listing_type === "SALE"
                              ? "bg-blue-50 text-blue-600 border border-blue-100"
                              : prop.listing_type === "RENT"
                                ? "bg-green-50 text-green-600 border border-green-100"
                                : "bg-amber-50 text-amber-600 border border-amber-100",
                          )}
                        >
                          {LISTING_TYPE_LABELS[
                            prop.listing_type as keyof typeof LISTING_TYPE_LABELS
                          ] || prop.listing_type}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-semibold text-slate-900">
                            {prop.view_count.toLocaleString()}
                          </span>
                          <ArrowUpRight className="h-3 w-3 text-blue-500 shrink-0" />
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                        <Link
                          href={`/protected/properties/${prop.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs md:text-sm whitespace-nowrap"
                        >
                          แก้ไข
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {topProperties.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        ยังไม่มีข้อมูลการเข้าชม
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Popular Areas Section */}
        <Card className="border-none shadow-sm flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 md:p-6">
            <CardTitle className="text-lg">
              อันดับย่านที่คนให้ความสนใจ
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              วิเคราะห์จากจำนวนวิวทรัพย์ในย่านนั้นๆ และความต้องการของลูกค้า
              (Leads)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 flex-1 overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 space-y-5 md:space-y-6">
              {topAreas.map((area: AreaAnalytics, idx: number) => (
                <div key={area.name} className="flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded bg-slate-100 text-[9px] md:text-[10px] font-bold text-slate-500">
                        {idx + 1}
                      </div>
                      <span className="font-medium text-sm md:text-base text-slate-800 truncate max-w-[120px] md:max-w-none">
                        {area.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-slate-900">
                        {area.view_count.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1 whitespace-nowrap">
                        Views
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 md:h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${(area.view_count / (topAreas[0]?.view_count || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {area.leads_count} Leads สนใจย่านนี้
                    </div>
                  </div>
                </div>
              ))}
              {topAreas.length === 0 && (
                <div className="py-10 text-center text-slate-400">
                  ยังไม่มีข้อมูลย่านต่างๆ
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Users } from "lucide-react";
