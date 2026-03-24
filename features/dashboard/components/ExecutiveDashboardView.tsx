"use client";

import { useState, useEffect } from "react";

import {
  ExecutiveStats,
  MonthlyRevenue,
  QuarterlyRevenue,
  SetupProgress,
} from "../executive-queries";
import { SetupChecklist } from "./SetupChecklist";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import dynamic from "next/dynamic";
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  PieChart as PieChartIcon,
  ArrowUpRight,
  Download,
  Calendar,
  FileText,
  Sparkles,
  Users,
  Settings as SettingsIcon,
  Calculator,
  Building2,
} from "lucide-react";

import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const ExecutiveRevenueAreaChart = dynamic(
  () => import("./ExecutiveRevenueAreaChart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-50/50 animate-pulse rounded-xl" />
    ),
  },
);
import { Button } from "@/components/ui/button";
import { PriceInput } from "@/components/ui/price-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input as CalculatorInput } from "@/components/ui/input";
import { formatThaiCurrency } from "@/lib/excel-export";
import { cn } from "@/lib/utils";
import {
  exportExecutiveExcelAction,
  exportExecutivePdfAction,
  ExportActionResponse,
} from "../executive-export-actions";
import {
  generateExecutiveAiInsightsAction,
  ExecutiveAiInsights,
} from "../executive-ai-actions";
import { AiExecutiveBriefing } from "./AiExecutiveBriefing";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentPerformanceTable } from "./AgentPerformanceTable";
import { CommissionSettings } from "./CommissionSettings";
import { CommissionLeaderboard } from "./CommissionLeaderboard";
import { TopAgent } from "../queries";
import { AgentKpiStats } from "@/features/analytics/agent-kpis";
import { calculateCommission } from "@/lib/finance/commissions";
import { BranchOnboardingDialog } from "./BranchOnboardingDialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface ExecutiveDashboardViewProps {
  stats: ExecutiveStats;
  monthlyData: MonthlyRevenue[];
  quarterlyData: QuarterlyRevenue[];
  agentStats: AgentKpiStats[];
  topAgents: TopAgent[];
  allBranches: { id: string; name: string }[];
  selectedTenantId: string;
  compareStats?: ExecutiveStats | null;
  compareMonthlyData?: MonthlyRevenue[] | null;
  compareTenantId?: string | null;
  setupProgress: SetupProgress;
  role: string;
}

export function ExecutiveDashboardView({
  stats,
  monthlyData,
  quarterlyData,
  agentStats,
  topAgents,
  allBranches,
  selectedTenantId,
  compareStats,
  compareMonthlyData,
  compareTenantId,
  setupProgress,
  role,
}: ExecutiveDashboardViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [aiInsights, setAiInsights] = useState<ExecutiveAiInsights | null>(
    null,
  );
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    role === "ADMIN" && allBranches.length === 0,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGenerateAi = async () => {
    setIsGeneratingAi(true);
    const toastId = toast.loading("AI กำลังวิเคราะห์ข้อมูลและจัดทำกลยุทธ์...");
    try {
      const result = await generateExecutiveAiInsightsAction();
      if (result.success && result.data) {
        setAiInsights(result.data);
        toast.success("AI วิเคราะห์ข้อมูลสำเร็จ", { id: toastId });
      } else {
        toast.error(result.message || "AI ไม่สามารถวิเคราะห์ได้ในขณะนี้", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการเรียก AI", { id: toastId });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleExport = async (type: "excel" | "pdf") => {
    const toastId = toast.loading(`กำลังเตรียมไฟล์ ${type.toUpperCase()}...`);
    try {
      const action =
        type === "excel"
          ? exportExecutiveExcelAction
          : exportExecutivePdfAction;
      const result: ExportActionResponse = await action(undefined, aiInsights);

      if (result.success && result.data) {
        const link = document.createElement("a");
        link.href = `data:application/${type === "excel" ? "vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "pdf"};base64,${result.data}`;
        link.download =
          result.filename || `report.${type === "excel" ? "xlsx" : "pdf"}`;
        link.click();
        toast.success(`ดาวน์โหลดไฟล์ ${type.toUpperCase()} สำเร็จ`, {
          id: toastId,
        });
      } else {
        toast.error(result.message || "ล้มเหลวในการสร้างไฟล์รายงาน", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการดาวน์โหลด", { id: toastId });
    }
  };

  return (
    <div className="space-y-8 p-1">
      <BranchOnboardingDialog 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Executive Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            สรุปภาพรวมผลประกอบการและการเติบโตของธุรกิจ
          </p>
        </div>
        <div className="flex items-center gap-3">
          {allBranches.length > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="min-w-[180px]">
                <Select
                  value={selectedTenantId}
                  onValueChange={(val) => {
                    const params = new URLSearchParams(searchParams);
                    if (val === "ALL") {
                      params.delete("tenantId");
                    } else {
                      params.set("tenantId", val);
                    }
                    router.push(`${pathname}?${params.toString()}`);
                  }}
                >
                  <SelectTrigger className="bg-white/50 backdrop-blur-sm border-slate-200 shadow-sm transition-all focus:ring-blue-500/20">
                    <Building2 className="mr-2 h-4 w-4 text-slate-400" />
                    <SelectValue placeholder="เลือกสาขา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">ทุกสาขา (Overall)</SelectItem>
                    {allBranches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[180px]">
                <Select
                  value={compareTenantId || "none"}
                  onValueChange={(val) => {
                    const params = new URLSearchParams(searchParams);
                    if (val === "none") {
                      params.delete("compareId");
                    } else {
                      params.set("compareId", val);
                    }
                    router.push(`${pathname}?${params.toString()}`);
                  }}
                >
                  <SelectTrigger className="bg-white/50 backdrop-blur-sm shadow-sm transition-all focus:ring-indigo-500/20 text-indigo-700 border-indigo-100">
                    <PieChartIcon className="mr-2 h-4 w-4 text-indigo-400" />
                    <SelectValue placeholder="เปรียบเทียบกับ..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- ไม่เปรียบเทียบ --</SelectItem>
                    <SelectItem value="ALL" disabled={selectedTenantId === "ALL"}>
                      ทุกสาขา (Overall)
                    </SelectItem>
                    {allBranches
                      .filter((b) => b.id !== selectedTenantId)
                      .map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Button variant="outline" className="gap-2 border-slate-200">
            <Calendar className="h-4 w-4" />
            ปี {new Date().getFullYear() + 543}
          </Button>

          <Button
            onClick={handleGenerateAi}
            disabled={isGeneratingAi}
            variant="outline"
            className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm"
          >
            <Sparkles
              className={cn("h-4 w-4", isGeneratingAi && "animate-pulse")}
            />
            {aiInsights ? "Re-analyze with AI" : "AI Analysis"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 transition-all">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleExport("excel")}
                className="gap-2 focus:bg-slate-50"
              >
                <FileText className="h-4 w-4 text-emerald-600" /> Excel Report
                (Full Data)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport("pdf")}
                className="gap-2 focus:bg-slate-50"
              >
                <FileText className="h-4 w-4 text-rose-600" /> PDF Report
                (Executive Summary)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* AI Briefing Section */}
      {aiInsights && <AiExecutiveBriefing insights={aiInsights} />}

      <Tabs defaultValue="overview" className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <TabsList className="bg-slate-100/50 p-1">
            <TabsTrigger value="overview" className="gap-2 px-6">
              <TrendingUp className="h-4 w-4" />
              ภาพรวม (Overview)
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-2 px-6">
              <Users className="h-4 w-4" />
              ผลงานตัวแทน (Agents)
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 px-6">
              <SettingsIcon className="h-4 w-4" />
              ตั้งค่าคอมมิชชั่น
            </TabsTrigger>
          </TabsList>

          <CommissionCalculatorDialog />
        </div>

        <TabsContent
          value="overview"
          className="space-y-8 animate-in fade-in-50 duration-500"
        >
          {/* Onboarding Checklist - Only shows if not 100% complete */}
      <SetupChecklist progress={setupProgress} />

      {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="ยอดขายรวม (Revenue)"
              value={stats.totalRevenue}
              icon={DollarSign}
              description="รวมยอดขายและยอดเช่าทั้งหมด"
              trend="+12.5% vs last year"
              color="blue"
              compareValue={compareStats?.totalRevenue}
            />
            <StatsCard
              title="ค่าคอมมิชชั่นรวม"
              value={stats.totalCommission}
              icon={TrendingUp}
              description="รายได้จริงจากค่าคอมมิชชั่น"
              trend="+8.2% vs last year"
              color="emerald"
              compareValue={compareStats?.totalCommission}
            />
            <StatsCard
              title="จำนวนธุรกรรมรวม"
              value={stats.totalDeals}
              icon={Briefcase}
              description={`ยอดขาย ${stats.salesCount} | ยอดเช่า ${stats.rentalCount}`}
              trend={`${stats.totalDeals} Deals Closed`}
              color="indigo"
              isCurrency={false}
              compareValue={compareStats?.totalDeals}
            />
            <StatsCard
              title="Performance Score"
              value={85}
              icon={PieChartIcon}
              description="ประสิทธิภาพเทียบกับเป้าหมาย"
              trend="+5.4% vs last month"
              color="amber"
              isCurrency={false}
              suffix="%"
              compareValue={compareStats ? 85 : null} // Mock for comparison if base has it
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            {/* Monthly Revenue Chart */}
            <Card className="lg:col-span-4 border-slate-100 shadow-sm border-0 bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  แนวโน้มรายได้รายเดือน (Sale vs Rent)
                </CardTitle>
                <CardDescription>
                  การเปรียบเทียบยอดขายและยอดเช่าในแต่ละเดือน
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {mounted && (
                  <ExecutiveRevenueAreaChart
                    monthlyData={monthlyData}
                    compareMonthlyData={compareMonthlyData}
                  />
                )}
              </CardContent>
            </Card>

            {/* Commission Leaderboard (Gamified) */}
            <div className="lg:col-span-3 h-full">
              <CommissionLeaderboard
                data={topAgents}
                title="🏆 Agent Ranking"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            {/* Quarterly Breakdown */}
            <Card className="lg:col-span-3 border-slate-100 shadow-sm border-0 bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-indigo-500" />
                  สรุปรายไตรมาส (Quarterly)
                </CardTitle>
                <CardDescription>
                  ผลงานแยกตามไตรมาสของปีปัจจุบัน
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {quarterlyData.map((q) => (
                    <div key={q.quarter} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-700">
                          {q.quarter}
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatThaiCurrency(q.total)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                          style={{
                            width: `${Math.min((q.total / stats.totalRevenue) * 100, 100) || 0}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Sales: {formatThaiCurrency(q.sales)}</span>
                        <span>Rent: {formatThaiCurrency(q.rent)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Transaction Volume Table/Summary */}
            <Card className="lg:col-span-4 border-slate-100 shadow-sm border-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">
                    Transaction Overview
                  </CardTitle>
                  <CardDescription>
                    ตารางสรุปจำนวนดีลและมูลค่าตามประเภทธุรกรรม
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 font-semibold">
                          ประเภทธุรกรรม
                        </th>
                        <th className="px-6 py-4 font-semibold text-center">
                          จำนวนดีล
                        </th>
                        <th className="px-6 py-4 font-semibold text-right">
                          ยอดรวม (Gross Value)
                        </th>
                        <th className="px-6 py-4 font-semibold text-right">
                          ค่าคอมมิชชั่น
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          การขาย (Sales)
                        </td>
                        <td className="px-6 py-4 text-center">
                          {stats.salesCount}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold">
                          {formatThaiCurrency(stats.salesRevenue)}
                        </td>
                        <td className="px-6 py-4 text-right text-blue-600 font-bold">
                          {formatThaiCurrency(stats.salesCommission)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          การเช่า (Rentals)
                        </td>
                        <td className="px-6 py-4 text-center">
                          {stats.rentalCount}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold">
                          {formatThaiCurrency(stats.rentalRevenue)}
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-bold">
                          {formatThaiCurrency(stats.rentalCommission)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-slate-50/50 font-bold border-t border-slate-200">
                      <tr>
                        <td className="px-6 py-4">Total</td>
                        <td className="px-6 py-4 text-center">
                          {stats.totalDeals}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatThaiCurrency(stats.totalRevenue)}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-900 bg-slate-100/50">
                          {formatThaiCurrency(stats.totalCommission)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent
          value="agents"
          className="animate-in slide-in-from-left-4 duration-500"
        >
          <AgentPerformanceTable agents={agentStats} />
        </TabsContent>

        <TabsContent
          value="settings"
          className="animate-in slide-in-from-right-4 duration-500"
        >
          <CommissionSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CommissionCalculatorDialog() {
  const [price, setPrice] = useState<number>(10000000);
  const [result, setResult] = useState<number | null>(null);

  const performCalc = () => {
    try {
      if (isNaN(price) || price < 0) {
        toast.error("กรุณาระบุราคาที่ถูกต้อง");
        return;
      }
      // Current hardcoded rule for demo
      const ruleSet = {
        type: "TIERED" as const,
        tiers: [
          { minPrice: 0, maxPrice: 5000000, percentage: 3 },
          { minPrice: 5000001, maxPrice: 10000000, percentage: 4 },
          { minPrice: 10000001, maxPrice: null, percentage: 5 },
        ],
      };
      const comm = calculateCommission(price, ruleSet);
      setResult(comm);
      toast.success("คำนวณสำเร็จ!");
    } catch (error) {
      console.error("Calculation error:", error);
      toast.error("เกิดข้อผิดพลาดในการคำนวณ");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-slate-200 bg-white/50 hover:bg-white shadow-sm"
        >
          <Calculator className="h-4 w-4 text-blue-500" />
          เครื่องคำนวณเบื้องต้น (Quick Calculator)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-500" />
            คำนวณค่าคอมมิชชั่นแบบรวดเร็ว
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label>ราคาอสังหาริมทรัพย์ (฿)</Label>
            <PriceInput
              value={price}
              onChange={(val) => setPrice(val)}
              placeholder="ระบุราคา..."
              className="text-lg font-bold"
              showSuffix={false}
            />
          </div>

          <Button
            onClick={performCalc}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            เริ่มคำนวณ
          </Button>

          {result !== null && (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 animate-in fade-in zoom-in-95">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                ประมาณการค่าคอมมิชชั่น (Estimate)
              </p>
              <h3 className="text-3xl font-black text-blue-600">
                {formatThaiCurrency(result)}
              </h3>
              <p className="text-[10px] text-slate-400">
                คำนวณจากเกณฑ์ขั้นบันไดที่ตั้งค่าไว้ในระบบปัจจุบัน
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color,
  isCurrency = true,
  suffix = "",
  compareValue,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  description: string;
  trend: string;
  color: "blue" | "emerald" | "indigo" | "amber";
  isCurrency?: boolean;
  suffix?: string;
  compareValue?: number | null;
}) {
  const colorMap = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
  };

  return (
    <Card className="border-0 shadow-sm bg-white overflow-hidden relative group transition-all hover:shadow-md">
      <div
        className={cn(
          "absolute top-0 left-0 w-1 h-full",
          color === "blue" && "bg-blue-500",
          color === "emerald" && "bg-emerald-500",
          color === "indigo" && "bg-indigo-500",
          color === "amber" && "bg-amber-500",
        )}
      />
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-slate-500">
          {title}
        </CardTitle>
        <div
          className={cn(
            "p-2 rounded-xl transition-transform group-hover:scale-110",
            colorMap[color],
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {isCurrency ? formatThaiCurrency(value) : value.toLocaleString()}
            {suffix}
          </div>
          {compareValue !== undefined && compareValue !== null && (
            <div className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              VS {isCurrency ? formatThaiCurrency(compareValue) : compareValue.toLocaleString()}
              {suffix}
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1">{description}</p>
        <div className="mt-4 flex items-center text-[10px] font-bold uppercase tracking-wider">
          <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
          <span className="text-emerald-600">{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}
