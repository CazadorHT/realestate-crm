"use client";

import { Sparkles, Building2, MapPin, Users2, User, ChevronRight, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/features/dashboard/queries/types";

interface SmartSummaryProps {
  initialStats?: DashboardStats;
  role?: string;
  userId?: string;
  multiTenantEnabled?: boolean;
}

type InsightScope = "company" | "branch" | "team" | "personal";

import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function SmartSummary({ initialStats, role, userId, multiTenantEnabled = true }: SmartSummaryProps) {
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const isEn = language === "en";
  const isAdmin = role === "ADMIN" || role === "MANAGER" || role === "OWNER";
  
  // --- Sync from URL ---
  const view = (searchParams.get("view") || (isAdmin ? "company" : "personal")) as InsightScope;
  const branchId = searchParams.get("branchId");
  const teamId = searchParams.get("teamId");

  const [stats, setStats] = useState<DashboardStats | undefined>(initialStats);
  const [loading, setLoading] = useState(false);
  const [identityName, setIdentityName] = useState<string>("ทั้งบริษัท");

  useEffect(() => {
    // If stats are provided from server and match current URL context, use them
    // (In Next.js 13+ with App Router, initialStats will be fresh on each navigation)
    setStats(initialStats);

    // Update Label based on context
    if (view === "company") setIdentityName(isEn ? "Company Overview" : "ภาพรวมบริษัท");
    else if (view === "branch") setIdentityName(branchId && branchId !== "all" ? (isEn ? "Selected Branch" : "สาขาที่เลือก") : (isEn ? "All Branches" : "ทุกสาขา"));
    else if (view === "team") setIdentityName(teamId && teamId !== "all" ? (isEn ? "Selected Team" : "ทีมที่เลือก") : (isEn ? "All Teams" : "ทุกทีม"));
    else setIdentityName(isEn ? "Personal Performance" : "ผลงานส่วนตัว");

  }, [initialStats, view, branchId, teamId, isEn]);

  const getInsightText = () => {
    if (loading) return isEn ? "Analyzing AI insights..." : "กำลังวิเคราะห์ข้อมูลเชิงลึก...";
    if (!stats) return isEn ? "No performance data found for this period" : "ไม่พบข้อมูลสำหรับช่วงเวลานี้";

    if (isEn) {
      return `This month for ${identityName}, total revenue is ฿${stats.revenueThisMonth.toLocaleString()}, generated from ${stats.leadsThisMonth} new prospective leads with ${stats.dealsWon} successfully closed deals.`;
    }

    return `เดือนนี้ในส่วนของ ${identityName} มีรายได้รวม ${stats.revenueThisMonth.toLocaleString()} บาท มีลีดใหม่ ${stats.leadsThisMonth} คน และปิดการขายไปแล้ว ${stats.dealsWon} ดีล`;
  };

  return (
    <div className="relative group ">
      {/* 🔮 Glow Effect */}
      <div className="absolute -inset-1 bg-linear-to-r from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
      
      <div className="relative z-10 bg-white border border-indigo-100 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4 transition-all duration-300 hover:shadow-indigo-200/50">
        
        {/* ✨ Animated Icon */}
        <div className="relative shrink-0">
          <div className="absolute -inset-2 bg-indigo-100 rounded-full animate-pulse opacity-50" />
          <div className="relative bg-linear-to-br from-indigo-600 to-violet-600 p-3 rounded-2xl shadow-lg shadow-indigo-200 transition-transform duration-500 group-hover:rotate-12">
            {loading ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5 text-white" />
            )}
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
              AI Daily Insight 
              <span className="h-1 w-1 rounded-full bg-indigo-300" />
              <span className="text-slate-400 font-semibold">{identityName}</span>
            </h3>
          </div>

          <p className="text-sm md:text-base font-medium text-slate-500 leading-relaxed">
            {getInsightText()}
          </p>
        </div>

      </div>
    </div>
  );
}
