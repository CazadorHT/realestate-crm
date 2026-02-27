"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Download,
  TrendingUp,
  Users,
  Briefcase,
  RefreshCcw,
  Building2,
  ArrowUpRight,
} from "lucide-react";
import { getExecutiveStatsAction } from "@/lib/actions/executive-stats";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ExecutiveDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const stats = await getExecutiveStatsAction();
      setData(stats);
    } catch (error) {
      toast.error("ไม่สามารถดึงข้อมูลสถิติได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalLeads = data.reduce((acc, curr) => acc + curr.leadCount, 0);
  const totalDeals = data.reduce((acc, curr) => acc + curr.dealCount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            แผงควบคุมระดับบริหาร (Executive Dashboard)
          </h1>
          <p className="text-slate-500 text-sm">
            ภาพรวมผลการดำเนินงานของทุกสาขาในองค์กร
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="rounded-lg font-medium"
          >
            <RefreshCcw
              className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            รีเฟรชข้อมูล
          </Button>
          <Button
            size="sm"
            className="bg-slate-900 text-white rounded-lg font-medium"
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            ส่งออกรายงาน
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-100 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              ลีดทั้งหมด (Global Leads)
            </CardTitle>
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalLeads.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">
              จาก {data.length} สาขา
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              ดีลที่ปิดได้ (Won Deals)
            </CardTitle>
            <div className="p-1.5 bg-emerald-50 rounded-lg">
              <Briefcase className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalDeals.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">
              ยอดรวมความสำเร็จ
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              จำนวนสาขา (Active Branches)
            </CardTitle>
            <div className="p-1.5 bg-amber-50 rounded-lg">
              <Building2 className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">
              สาขาที่เปิดดำเนินการ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-100 shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              การเปรียบเทียบจำนวนลีดรายสาขา
            </CardTitle>
            <CardDescription className="text-xs">
              เปรียบเทียบศักยภาพในการหาลูกค้าของแต่ละสาขา
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="tenantName"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area
                    type="monotone"
                    dataKey="leadCount"
                    name="จำนวนลีด"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorLeads)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-emerald-500" />
              การเปรียบเทียบจำนวนดีลรายสาขา
            </CardTitle>
            <CardDescription className="text-xs">
              แสดงจำนวนดีลที่ปิดการขายสำเร็จ (Status: WON)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="tenantName"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area
                    type="monotone"
                    dataKey="dealCount"
                    name="จำนวนดีลชนะ"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorDeals)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">
            รายละเอียดรายสาขา
          </CardTitle>
          <CardDescription className="text-xs">
            ข้อมูลตัวเลขเชิงลึกแยกตามสาขา
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                <TableHead className="px-6 py-4 font-semibold text-slate-600 text-[11px] uppercase tracking-wider">
                  ชื่อสาขา
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-600 text-[11px] uppercase tracking-wider">
                  จำนวนลีด
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-600 text-[11px] uppercase tracking-wider">
                  ดีลที่ชนะ
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-600 text-[11px] uppercase tracking-wider px-6">
                  อัตราการปิดดีล (%)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => {
                const conversionRate =
                  row.leadCount > 0
                    ? ((row.dealCount / row.leadCount) * 100).toFixed(1)
                    : "0.0";

                return (
                  <TableRow
                    key={row.tenantId}
                    className="hover:bg-blue-50/20 transition-colors border-b border-slate-50 last:border-0"
                  >
                    <TableCell className="px-6 py-4 font-medium text-slate-700 text-sm">
                      {row.tenantName}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {row.leadCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600 text-sm">
                      {row.dealCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                        <span className="text-sm font-medium text-slate-600">
                          {conversionRate}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {data.length === 0 && !loading && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-slate-400 text-sm"
                  >
                    ไม่พบข้อมูลสาขา
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
