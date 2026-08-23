"use client";

import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { UsersStatsSummary } from "@/features/users/UsersStatsSummary";
import { UsersTable } from "@/features/users/UsersTable";
import { type EliteUser } from "@/lib/users-utils";
import { siteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import { Users2 } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/language-context";

interface UsersPageViewProps {
  eliteUsers: EliteUser[];
  currentUserId: string;
  teams: { id: string; name: string }[];
  isMultiTenant: boolean;
  stats: {
    totalUsers: number;
    totalAdmins: number;
    totalAgents: number;
    totalUsersWaiting: number;
  };
}

export function UsersPageView({
  eliteUsers,
  currentUserId,
  teams,
  isMultiTenant,
  stats,
}: UsersPageViewProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="relative min-h-[calc(100vh-12rem)] pb-20 overflow-visible">
      {/* Immersive Background Layer */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-slate-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-100/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-screen-2xl mx-auto p-4 md:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Elite Header */}
        <SettingsHeader 
          title={isEn ? "User & Staff Management" : "จัดการรายชื่อสมาชิกพนักงาน"}
          description={
            isEn 
              ? `Review and manage team roles for ${siteConfig.company} with enterprise security and access control.` 
              : `ตรวจสอบและจัดการบทบาทของสมาชิกทีม ${siteConfig.company} เพื่อความปลอดภัยและการเข้าถึงข้อมูลระดับสูงสุด`
          }
          subPath={[
            { label: isEn ? "System Control" : "System Control", href: "/protected/settings" },
            { label: isEn ? "All Users (Staff)" : "พนักงานทั้งหมด (Users)" }
          ]}
          actions={
            <Link href="/protected/settings/teams" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="rounded-2xl w-full h-12 px-6 border-slate-200 bg-white/50 hover:bg-white hover:border-slate-300 transition-all duration-300 flex items-center gap-2 group shadow-sm"
              >
                <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-blue-50 transition-colors">
                  <Users2 className="h-4 w-4 text-slate-600 group-hover:text-blue-600" />
                </div>
                <span className="font-semibold text-slate-700 whitespace-nowrap">{isEn ? "Manage Teams" : "จัดการทีม"}</span>
              </Button>
            </Link>
          }
        />

        {/* Statistics Summary - Elite Glassmorphism */}
        <UsersStatsSummary
          totalUsers={stats.totalUsers}
          totalAdmins={stats.totalAdmins}
          totalAgents={stats.totalAgents}
          totalUsersWaiting={stats.totalUsersWaiting}
        />

        {/* Table Section with Elite title and Glass Table */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 bg-slate-900 rounded-full" />
              <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
                {isEn ? "All Team Members" : "รายชื่อสมาชิกทีมทั้งหมด"}
              </h2>
            </div>
          </div>
          
          <UsersTable
            users={eliteUsers}
            currentUserId={currentUserId}
            teams={teams || []}
            isMultiTenant={isMultiTenant}
          />
        </div>
      </div>
    </div>
  );
}
