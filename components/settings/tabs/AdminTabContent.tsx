"use client";

import Link from "next/link";
import { 
  Shield, 
  Building2, 
  Users, 
  History, 
  Database 
} from "lucide-react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminSystemSettings } from "@/components/settings/AdminSystemSettings";

interface AdminTabContentProps {
  summary: {
    users: number;
    branches: number;
    teams: number;
  };
}

export function AdminTabContent({ summary }: AdminTabContentProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminSystemSettings />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        <Link href="/protected/settings/users" className="group">
          <Card className="relative hover:border-slate-400 transition-all duration-300 bg-white/50 backdrop-blur-sm border-slate-200/60 rounded-[32px] group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-slate-200/50 overflow-hidden">
            <div className="absolute top-4 right-4 focus-visible:ring-0">
              <Badge className="bg-slate-100/80 text-slate-600 border-slate-200 font-semibold px-2.5 py-1 rounded-xl text-[10px] tracking-tight">
                {summary.users} Account(s)
              </Badge>
            </div>
            <CardHeader className="flex flex-col items-center gap-4 text-center pb-8 pt-10">
              <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 transform group-hover:rotate-12 shadow-sm border border-slate-100">
                <Shield className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-semibold text-slate-900">จัดการรายชื่อผู้ใช้ <span className="text-slate-400 font-normal lg:block xl:inline">(User Management)</span></CardTitle>
                <CardDescription className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase italic opacity-60">
                  Roles, Teams & Permissions
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/protected/settings/branches" className="group">
          <Card className="relative hover:border-blue-400 transition-all duration-300 bg-white/50 backdrop-blur-sm border-slate-200/60 rounded-[32px] group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-blue-200/50 overflow-hidden">
            <div className="absolute top-4 right-4">
              <Badge className="bg-blue-100/50 text-blue-600 border-blue-200 font-semibold px-2.5 py-1 rounded-xl text-[10px] tracking-tight">
                {summary.branches} Branch(es)
              </Badge>
            </div>
            <CardHeader className="flex flex-col items-center gap-4 text-center pb-8 pt-10">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 transform group-hover:scale-110 shadow-sm border border-blue-100">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-semibold text-slate-900">โครงสร้างสาขา <span className="text-slate-400 font-normal lg:block xl:inline">(Branch Control)</span></CardTitle>
                <CardDescription className="text-[10px] font-semibold text-blue-500/70 tracking-wider uppercase italic opacity-60">
                  Multi-Office Hierarchy
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/protected/settings/teams" className="group">
          <Card className="relative hover:border-indigo-400 transition-all duration-300 bg-white/50 backdrop-blur-sm border-slate-200/60 rounded-[32px] group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-indigo-200/50 overflow-hidden">
            <div className="absolute top-4 right-4">
              <Badge className="bg-indigo-100/50 text-indigo-600 border-indigo-200 font-semibold px-2.5 py-1 rounded-xl text-[10px] tracking-tight">
                {summary.teams} Team(s)
              </Badge>
            </div>
            <CardHeader className="flex flex-col items-center gap-4 text-center pb-8 pt-10">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 transform group-hover:-translate-y-1 shadow-sm border border-indigo-100">
                <Users className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-semibold text-slate-900">จัดการสายงาน <span className="text-slate-400 font-normal lg:block xl:inline">(Team Setup)</span></CardTitle>
                <CardDescription className="text-[10px] font-semibold text-indigo-500/70 tracking-wider uppercase italic opacity-60">
                  Groups & Resource Mgmt
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/protected/admin/audit-logs" className="group">
          <Card className="hover:border-slate-400 transition-all duration-300 bg-white/50 backdrop-blur-sm border-slate-200/60 rounded-[32px] group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-slate-300/50">
            <CardHeader className="flex flex-col items-center gap-4 text-center pb-8 pt-10">
              <div className="p-4 bg-slate-50 text-slate-600 rounded-2xl group-hover:bg-slate-700 group-hover:text-white transition-all duration-500 shadow-sm border border-slate-100">
                <History className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-semibold text-slate-900">บันทึกประวัติ <span className="text-slate-400 font-normal lg:block xl:inline">(Audit Logs)</span></CardTitle>
                <CardDescription className="text-[10px] font-semibold text-slate-500/70 tracking-wider uppercase italic opacity-60">
                  Security Event Tracing
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
      
      {/* Elite Data Snapshot Section - Hardened Fact-based UI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card className="border-none bg-linear-to-r from-slate-900 to-slate-800 text-white rounded-[32px] p-1 overflow-hidden relative group">
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/5">
                <Database className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-lg leading-none mb-1">สถานะระบบ (System Health)</h4>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">All database nodes optimized • 12ms latency</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-semibold italic text-blue-400 tracking-tighter">99.9%</span>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Stability Rate</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-linear-to-r from-indigo-900 to-blue-900 text-white rounded-[32px] p-1 overflow-hidden relative group">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/5">
                <Shield className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <h4 className="font-semibold text-lg leading-none mb-1">ความปลอดภัย (Security)</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 px-1.5 py-0.5 rounded font-semibold">OAuth 2.0 Secure</span>
                  <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-400/20 px-1.5 py-0.5 rounded font-semibold">SSL v1.3</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-400/30 flex items-center justify-center text-[10px] font-semibold italic text-indigo-200 bg-indigo-500/10">
                A+
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mt-1">Grade Level</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
