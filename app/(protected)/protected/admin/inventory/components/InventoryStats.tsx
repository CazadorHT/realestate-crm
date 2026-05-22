"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Target, Layers, Building2, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InventoryStatsProps {
  totalCount: number;
  activeCount: number;
  branchCount: number;
  isLoading: boolean;
  onFilterClick?: (filter: { status?: string; tenant?: string }) => void;
  currentStatus?: string;
}

// 🛡️ Premium Skeleton for Stats
const StatSkeleton = () => (
  <div className="space-y-3">
    <div className="h-4 w-12 bg-slate-100 animate-pulse rounded" />
    <div className="h-4 w-24 bg-slate-100 animate-pulse rounded" />
    <div className="h-8 w-16 bg-slate-200 animate-pulse rounded" />
  </div>
);

export function InventoryStats({
  totalCount,
  activeCount,
  branchCount,
  isLoading,
  onFilterClick,
  currentStatus,
}: InventoryStatsProps) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Inventory Card */}
      <button 
        onClick={() => onFilterClick?.({ status: "ALL" })}
        className="text-left outline-hidden transition-all duration-300 active:scale-[0.98]"
      >
        <Card className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-50 rounded-full opacity-50 group-hover:scale-125 transition-transform" />
          <div className="flex items-start justify-between relative z-10">
            {isLoading ? (
              <StatSkeleton />
            ) : (
              <div className="space-y-2">
                <div className="p-1.5 bg-blue-50 rounded-lg w-fit">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  ทรัพย์สินทั้งหมด
                </div>
                <div className="text-3xl font-semibold text-slate-900">
                  {totalCount.toLocaleString()}
                </div>
              </div>
            )}
            <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </div>
        </Card>
      </button>

      {/* Online/Active Card - Interactive */}
      <button 
        onClick={() => onFilterClick?.({ status: "ACTIVE" })}
        className="text-left outline-hidden transition-all duration-300 active:scale-[0.98]"
      >
        <Card className={cn(
          "bg-white p-5 rounded-2xl border transition-all duration-300 group overflow-hidden relative shadow-sm hover:shadow-md",
          currentStatus === "ACTIVE" ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-slate-100"
        )}>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-50 rounded-full opacity-50 group-hover:scale-125 transition-transform" />
          <div className="flex items-start justify-between relative z-10">
            {isLoading ? (
              <StatSkeleton />
            ) : (
              <div className="space-y-2">
                <div className="p-1.5 bg-emerald-50 rounded-lg w-fit relative">
                  <Layers className="h-4 w-4 text-emerald-600" />
                  <div className="absolute top-0 right-0 h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                </div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  ระบบออนไลน์ (Active)
                </div>
                <div className="text-3xl font-semibold text-slate-900">
                  {activeCount.toLocaleString()}
                </div>
              </div>
            )}
            <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </div>
        </Card>
      </button>

      {/* Branch Stats Card */}
      <Card className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group overflow-hidden relative">
        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-orange-50 rounded-full opacity-50 group-hover:scale-125 transition-transform" />
        <div className="flex items-start justify-between relative z-10">
          {isLoading ? (
            <StatSkeleton />
          ) : (
            <div className="space-y-2">
              <div className="p-1.5 bg-orange-50 rounded-lg w-fit">
                <Building2 className="h-4 w-4 text-orange-600" />
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                สาขาที่ร่วมรายการ
              </div>
              <div className="text-3xl font-semibold text-slate-900">
                {branchCount}
              </div>
            </div>
          )}
          <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
        </div>
      </Card>
    </div>
  );
}
