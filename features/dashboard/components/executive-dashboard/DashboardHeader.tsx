"use client";

import React from "react";
import {
  Building2,
  PieChart as PieChartIcon,
  Calendar,
  Sparkles,
  Download,
  FileText,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface DashboardHeaderProps {
  allBranches: { id: string; name: string }[];
  selectedTenantId: string;
  compareTenantId?: string | null;
  isGeneratingAi: boolean;
  aiInsights: ExecutiveAiInsights | null;
  onGenerateAi: () => void;
  onExport: (type: "excel" | "pdf") => void;
}

export function DashboardHeader({
  allBranches,
  selectedTenantId,
  compareTenantId,
  isGeneratingAi,
  aiInsights,
  onGenerateAi,
  onExport,
}: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
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
          onClick={onGenerateAi}
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
              onClick={() => onExport("excel")}
              className="gap-2 focus:bg-slate-50"
            >
              <FileText className="h-4 w-4 text-emerald-600" /> Excel Report
              (Full Data)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onExport("pdf")}
              className="gap-2 focus:bg-slate-50"
            >
              <FileText className="h-4 w-4 text-rose-600" /> PDF Report
              (Executive Summary)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
