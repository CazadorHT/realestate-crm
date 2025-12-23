import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Edit, Share2, Archive, MoreHorizontal } from "lucide-react";

// Widgets
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { SmartSummary } from "@/components/dashboard/SmartSummary";
import { PipelineSummary } from "@/components/dashboard/PipelineSummary";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { AgendaList } from "@/components/dashboard/AgendaList";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { FollowUpInsights } from "@/components/dashboard/FollowUpInsights";
import { RiskAlerts } from "@/components/dashboard/RiskAlerts";
import { MissingDataAlert } from "@/components/dashboard/MissingDataAlert";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { GlobalSearch } from "@/components/dashboard/GlobalSearch";

// Queries
import {
  getDashboardStats,
  getRevenueChartData,
  getFunnelStats,
  getPipelineStats,
  getTopAgents,
} from "@/features/dashboard/queries";
import { TopAgents } from "@/components/dashboard/TopAgents";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { isStaff } from "@/lib/authz";

import type { Database } from "@/lib/database.types";
type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await getCurrentProfile();
  const staff = profile ? isStaff(profile.role) : false;

  // Fetch Dashboard Data only for staff
  let properties: PropertyRow[] = [];
  let dashboardStats: any = null;
  let revenueData: any = [];
  let funnelData: any = [];
  let pipelineData: any = null;
  let topAgents: any = [];

  if (staff) {
    const [recentPropertiesResult, stats, revenue, funnel, pipeline, agents] =
      await Promise.all([
        supabase
          .from("properties")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
        getDashboardStats(),
        getRevenueChartData(),
        getFunnelStats(),
        getPipelineStats(),
        getTopAgents(),
      ]);

    properties = (recentPropertiesResult.data ?? []) as PropertyRow[];
    dashboardStats = stats;
    revenueData = revenue;
    funnelData = funnel;
    pipelineData = pipeline;
    topAgents = agents;
  }

  return (
    <div className="flex flex-col gap-6 p-2 pb-20">
      {/* 1. HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            สวัสดี, {user?.email} 👋
          </h2>
          <p className="text-muted-foreground">
            Sales Cockpit Update: ศูนย์บริหารงานขายอสังหาฯ ของคุณ
          </p>
        </div>
        <GlobalSearch />{" "}
        {/* Global Search ค้นหา (ชื่อทรัพย์, ลูกค้า, เบอร์โทร, รหัส... 🔴 */}
      </div>

      {!staff ? (
        <Card className="p-12 text-center border-dashed">
          <CardHeader>
            <CardTitle className="text-2xl">
              บัญชีของคุณอยู่ระหว่างการรออนุมัติ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground max-w-md mx-auto">
              ยินดีต้อนรับสู่ระบบ!
              เนื่องจากระบบนี้จำกัดการเข้าถึงเฉพาะเอเจนท์ที่ได้รับอนุญาตเท่านั้น
              รบกวนรอแอดมินปลดล็อคสิทธิ์ให้คุณ (AGENT) ก่อน
              จึงจะสามารถดูข้อมูลบ้านและลูกค้าได้ครับ
            </p>
            <div className="pt-4 flex justify-center gap-4">
              <Button asChild>
                <Link href="/protected/profile">ไปที่หน้าโปรไฟล์ของคุณ</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 2. SMART SUMMARY สรุปประจำวัน 🔴   */}
          <SmartSummary />

          {/* 3. KPI CARDS  การ์ด 🔴 Connected to DB */}
          <StatsOverview stats={dashboardStats} />

          {/* 4. MAIN ANALYTICS & OPERATIONS GRID */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* LEFT COLUMN (2/3 width on large screens) */}
            <div className="xl:col-span-2 flex flex-col gap-6">
              {/* PIPELINE & FUNNEL ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PipelineSummary data={pipelineData} />
                <FunnelChart data={funnelData} />
              </div>

              {/* REVENUE CHART */}
              <div className="h-[350px]">
                <RevenueChart data={revenueData} />
              </div>

              {/* TOP AGENTS & INSIGHTS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <TopAgents data={topAgents} />
                </div>
                <div className="flex flex-col gap-4">
                  <FollowUpInsights />
                  <RiskAlerts />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (1/3 width) */}
            <div className="flex flex-col gap-6">
              <QuickActions /> {/* Quick Actions เมนูเร็ว  🟢 */}
              <AgendaList /> {/* Agenda List 🟡 */}
              <NotificationCenter /> {/* Notification Center 🟠 */}
            </div>
          </div>

          {/* 5. RECENT PROPERTIES TABLE */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                ทรัพย์มาใหม่ (Recent Listings)
              </h3>
              <Button variant="outline" size="sm" asChild>
                <Link href="/protected/properties">ดูทั้งหมด</Link>
              </Button>
            </div>
            {/* Table Property 🟢🟡🟠  */}
            <Card className="shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 font-medium">ชื่อทรัพย์</th>
                      <th className="px-6 py-3 font-medium">ราคา</th>
                      <th className="px-6 py-3 font-medium">ประเภท</th>
                      <th className="px-6 py-3 font-medium">สถานะ</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {properties.map((property) => (
                      <tr
                        key={property.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium">
                          <div className="flex flex-col">
                            <span className="text-foreground font-semibold">
                              {property.title || "ไม่ระบุชื่อ"}
                            </span>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {property.description || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {property.price
                            ? property.price.toLocaleString("th-TH", {
                                maximumFractionDigits: 0,
                              })
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <Badge variant="secondary" className="uppercase">
                            {property.property_type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className={`
                              ${
                                property.status === "ACTIVE"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : property.status === "ARCHIVED"
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                  : "bg-gray-50 text-gray-700 border-gray-200"
                              }
                            `}
                          >
                            {property.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/protected/properties/${property.id}`}
                                  className="cursor-pointer"
                                >
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/protected/properties/${property.id}/edit`}
                                  className="cursor-pointer"
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                  Property
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer">
                                <Share2 className="mr-2 h-4 w-4" /> Share
                                Listing
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600 cursor-pointer">
                                <Archive className="mr-2 h-4 w-4" /> Archive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                    {properties.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          ไม่พบข้อมูลทรัพย์ล่าสุด
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
