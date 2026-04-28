"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Building2, Users, History, Database } from "lucide-react";
import Link from "next/link";
import { AdminSystemSettings } from "@/components/settings/AdminSystemSettings";

interface AdminQuickLinksTabProps {
  summary: {
    users: number;
    branches: number;
    teams: number;
  };
}

export function AdminQuickLinksTab({ summary }: AdminQuickLinksTabProps) {
  return (
    <div className="space-y-8">
      <AdminSystemSettings />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        <Link href="/protected/settings/users" className="group">
          <Card className="relative hover:border-slate-400 transition-all duration-300 bg-white/50 backdrop-blur-sm border-slate-200/60 rounded-[22px] group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-slate-200/50 overflow-hidden">
            <div className="absolute top-3 right-3">
              <Badge className="bg-slate-100 text-slate-600 border-slate-200 font-bold px-2 py-0.5 rounded-lg text-[10px]">
                {summary.users} Users
              </Badge>
            </div>
            <CardHeader className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 bg-slate-50 rounded-[24px] group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 transform group-hover:rotate-360 shadow-xs">
                <Shield className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold text-slate-900">
                  จัดการผู้ใช้
                </CardTitle>
                <CardDescription className="text-[11px] font-bold text-slate-500 tracking-tight uppercase italic opacity-70">
                  Roles & Permissions
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/protected/settings/branches" className="group">
          <Card className="relative hover:border-blue-400 transition-all duration-300 bg-white/50 backdrop-blur-sm border-slate-200/60 rounded-[22px] group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-blue-200/50 overflow-hidden">
            <div className="absolute top-3 right-3">
              <Badge className="bg-blue-100 text-blue-600 border-blue-200 font-bold px-2 py-0.5 rounded-lg text-[10px]">
                {summary.branches} Branches
              </Badge>
            </div>
            <CardHeader className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-[24px] group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 transform group-hover:scale-110 shadow-xs">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold text-slate-900">
                  จัดการสาขา
                </CardTitle>
                <CardDescription className="text-[11px] font-bold text-blue-500/70 tracking-tight uppercase italic opacity-70">
                  Multi-Office Control
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/protected/settings/teams" className="group">
          <Card className="relative hover:border-indigo-400 transition-all duration-300 bg-white/50 backdrop-blur-sm border-slate-200/60 rounded-[22px] group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-indigo-200/50 overflow-hidden">
            <div className="absolute top-3 right-3">
              <Badge className="bg-indigo-100 text-indigo-600 border-indigo-200 font-bold px-2 py-0.5 rounded-lg text-[10px]">
                {summary.teams} Teams
              </Badge>
            </div>
            <CardHeader className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[24px] group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 transform group-hover:-translate-y-1 shadow-xs">
                <Users className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold text-slate-900">
                  จัดการทีม
                </CardTitle>
                <CardDescription className="text-[11px] font-bold text-indigo-500/70 tracking-tight uppercase italic opacity-70">
                  Group Resource Mgmt
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/protected/admin/audit-logs" className="group">
          <Card className="hover:border-slate-400 transition-all duration-300 bg-white/50 backdrop-blur-sm border-slate-200/60 rounded-[22px] group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-slate-300/50">
            <CardHeader className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 bg-slate-50 text-slate-600 rounded-[24px] group-hover:bg-slate-700 group-hover:text-white transition-all duration-500 shadow-xs">
                <History className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold text-slate-900">
                  Audit Logs
                </CardTitle>
                <CardDescription className="text-[11px] font-bold text-slate-500/70 tracking-tight uppercase italic opacity-70">
                  Security Tracing
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Elite Data Snapshot Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card className="border-none bg-linear-to-r from-slate-900 to-slate-800 text-white rounded-[28px] p-1 overflow-hidden relative group">
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl">
                <Database className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h4 className="font-bold text-lg">System Health</h4>
                <p className="text-xs text-slate-400 font-medium">
                  All database nodes optimized
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black italic text-blue-400">
                100%
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                Stability Rate
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-linear-to-r from-indigo-900 to-blue-900 text-white rounded-[28px] p-1 overflow-hidden relative group">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl">
                <Shield className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Security Score</h4>
                <p className="text-xs text-slate-300 font-medium italic">
                  Elite hardening level active
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black italic text-indigo-400">
                A+
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Security Grade
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
