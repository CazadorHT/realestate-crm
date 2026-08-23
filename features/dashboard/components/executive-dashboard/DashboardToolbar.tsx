"use client";

import React from "react";
import {
  Building2,
  PieChart as PieChartIcon,
  Calendar,
  Sparkles,
  Download,
  FileText,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ExecutiveAiInsights } from "../../executive-ai-actions";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface DashboardToolbarProps {
  allBranches: { id: string; name: string }[];
  selectedTenantId: string;
  compareTenantId?: string | null;
  isGeneratingAi: boolean;
  aiInsights: ExecutiveAiInsights | null;
  onGenerateAi: () => void;
  onExport: (type: "excel" | "pdf") => void;
}

export function DashboardToolbar({
  allBranches,
  selectedTenantId,
  compareTenantId,
  isGeneratingAi,
  aiInsights,
  onGenerateAi,
  onExport,
}: DashboardToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const isEn = language === "en";

  // Year Selection Logic
  const currentYear = new Date().getFullYear();
  const selectedYear = searchParams.get("year") || currentYear.toString();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  const handleYearChange = (year: string) => {
    const params = new URLSearchParams(searchParams);
    if (year === currentYear.toString()) {
      params.delete("year");
    } else {
      params.set("year", year);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "ALL" || value === "none") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div id="tour-toolbar" className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 sm:gap-4 w-full bg-white/50 backdrop-blur-md border border-slate-200/60 p-2 sm:p-3 rounded-2xl shadow-sm">
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
        {allBranches.length > 0 && (
          <>
            {/* Branch Selector */}
            <div className="w-full sm:w-[220px]">
              <ResponsiveSelect
                value={selectedTenantId}
                onValueChange={(val) => updateParam("tenantId", val)}
                options={[
                  { value: "ALL", label: isEn ? "All Branches (Overall)" : "ทุกสาขา (Overall)" },
                  ...allBranches.map((b) => ({ value: b.id, label: b.name })),
                ]}
                trigger={
                  <Button
                    variant="outline"
                    className="w-full h-10 sm:h-11 justify-start gap-2 sm:gap-3 bg-white border-slate-200 shadow-xs rounded-xl px-3 sm:px-4 font-semibold hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/30 transition-all text-xs sm:text-sm cursor-pointer"
                  >
                    <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                    <span className="truncate">
                      {allBranches.find((b) => b.id === selectedTenantId)
                        ?.name || (isEn ? "All Branches (Overall)" : "ทุกสาขา (Overall)")}
                    </span>
                  </Button>
                }
                title={isEn ? "Select Branch" : "เลือกสาขา"}
              />
            </div>

            {/* Comparison Selector */}
            <div className="w-full sm:w-[220px]">
              <ResponsiveSelect
                value={compareTenantId || "none"}
                onValueChange={(val) => updateParam("compareId", val)}
                options={[
                  { value: "none", label: isEn ? "-- No Comparison --" : "-- ไม่เปรียบเทียบ --" },
                  {
                    value: "ALL",
                    label: isEn ? "All Branches (Overall)" : "ทุกสาขา (Overall)",
                    disabled: selectedTenantId === "ALL",
                  },
                  ...allBranches
                    .filter((b) => b.id !== selectedTenantId)
                    .map((b) => ({ value: b.id, label: b.name })),
                ]}
                trigger={
                  <Button
                    variant="outline"
                    className="w-full h-10 sm:h-11 justify-start gap-2 sm:gap-3 bg-white border-indigo-100 hover:text-indigo-700 hover:border-indigo-200 text-indigo-700 shadow-xs rounded-xl px-3 sm:px-4 font-semibold hover:bg-indigo-50/50 transition-all text-xs sm:text-sm cursor-pointer"
                  >
                    <PieChartIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-400" />
                    <span className="truncate">
                      {compareTenantId === "ALL"
                        ? (isEn ? "All Branches (Overall)" : "ทุกสาขา (Overall)")
                        : allBranches.find((b) => b.id === compareTenantId)
                            ?.name || (isEn ? "Compare with..." : "เปรียบเทียบกับ...")}
                    </span>
                  </Button>
                }
                title={isEn ? "Compare Data" : "เปรียบเทียบข้อมูล"}
              />
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3">
        {/* Year Selector */}
        <div className="w-full sm:w-auto">
          <ResponsiveSelect
            value={selectedYear}
            onValueChange={handleYearChange}
            options={years.map((y) => ({
              value: y,
              label: isEn ? `Year ${y}` : `ปี ${parseInt(y) + 543}`,
            }))}
            trigger={
              <Button
                variant="outline"
                className="w-full sm:w-auto h-10 sm:h-11 gap-2 sm:gap-3 hover:text-indigo-700 hover:border-indigo-200 text-indigo-700 border-slate-200 rounded-xl bg-white font-semibold hover:bg-slate-50 transition-all text-xs sm:text-sm cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500" />
                {isEn ? `Year ${selectedYear}` : `ปี ${parseInt(selectedYear) + 543}`}
              </Button>
            }
            title={isEn ? "Select Budget Year" : "เลือกปีงบประมาณ"}
          />
        </div>

        <Button
          onClick={onGenerateAi}
          disabled={isGeneratingAi}
          variant="outline"
          className="h-10 sm:h-11 gap-2 sm:gap-3 border-indigo-100 hover:text-indigo-700 hover:border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-xs rounded-xl bg-indigo-50/30 font-semibold transition-all text-xs sm:text-sm cursor-pointer"
        >
          <Sparkles
            className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isGeneratingAi && "animate-pulse")}
          />
          <span className="hidden sm:inline">
            {aiInsights ? (isEn ? "Analyze" : "วิเคราะห์") : (isEn ? "AI Analysis" : "วิเคราะห์ด้วย AI")}
          </span>
          <span className="sm:hidden">AI</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-10 sm:h-11 col-span-2 sm:col-auto gap-2 sm:gap-3 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100 transition-all rounded-xl font-semibold text-xs sm:text-sm cursor-pointer">
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {isEn ? "Export Report" : "ส่งออกรายงาน"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl p-1 shadow-xl border-slate-200/60">
            <DropdownMenuItem
              onClick={() => onExport("excel")}
              className="gap-3 focus:bg-slate-50 rounded-lg py-2.5 font-semibold cursor-pointer text-sm"
            >
              <FileText className="h-4 w-4 text-emerald-600" /> {isEn ? "Excel Report (Full)" : "Excel Report (ฉบับเต็ม)"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onExport("pdf")}
              className="gap-3 focus:bg-slate-50 rounded-lg py-2.5 font-semibold cursor-pointer text-sm"
            >
              <FileText className="h-4 w-4 text-rose-600" /> {isEn ? "PDF Summary" : "PDF Summary (สรุป)"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Internal Responsive Selection Helper
function ResponsiveSelect({
  value,
  onValueChange,
  options,
  trigger,
  title,
}: {
  value: string;
  onValueChange: (val: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  trigger: React.ReactNode;
  title: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={title}
      className="max-w-xs"
    >
      <ScrollArea className="max-h-[300px] p-2">
        <div className="grid gap-1">
          {options.map((option) => (
            <Button
              key={option.value}
              variant="ghost"
              className={cn(
                "w-full justify-between items-center h-12 rounded-xl px-4 cursor-pointer",
                value === option.value
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 font-bold"
                  : "text-slate-600 font-semibold",
              )}
              disabled={option.disabled}
              onClick={() => {
                onValueChange(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              {value === option.value && <Check className="h-4 w-4" />}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </ResponsiveDialog>
  );
}
