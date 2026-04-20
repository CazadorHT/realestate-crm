"use client";

import { m } from "framer-motion";
import { Users2, Clock, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BranchStatsProps {
  memberCount: number;
  inviteCount: number;
  propertyCount: number;
}

export function BranchStatsDashboard({
  memberCount,
  inviteCount,
  propertyCount,
}: BranchStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Members Card - Indigo Gradient */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group overflow-hidden bg-white/50 backdrop-blur-md border border-slate-200 rounded-[32px] p-8 shadow-sm flex items-center justify-between"
      >
        <div className="absolute top-0 right-0 h-full w-2 bg-indigo-500/10 group-hover:w-full transition-all duration-500 -z-10" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
            สมาชิกทั้งหมด (Total Members)
          </p>
          <h4 className="text-3xl font-semibold text-slate-900 leading-none">
            {memberCount}
          </h4>
        </div>
        <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
          <Users2 className="h-7 w-7 text-indigo-600" />
        </div>
      </m.div>

      {/* Invites Card - Amber Gradient */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative group overflow-hidden bg-white/50 backdrop-blur-md border border-slate-200 rounded-[32px] p-8 shadow-sm flex items-center justify-between"
      >
        <div className="absolute top-0 right-0 h-full w-2 bg-amber-500/10 group-hover:w-full transition-all duration-500 -z-10" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
            คำเชิญที่รออยู่ (Pending Invites)
          </p>
          <div className="flex items-center gap-2">
            <h4 className="text-3xl font-semibold text-slate-900 leading-none">
              {inviteCount}
            </h4>
            {inviteCount > 0 && (
              <Badge className="bg-amber-100/80 text-amber-700 border-amber-200 font-semibold animate-pulse rounded-lg">
                Waiting
              </Badge>
            )}
          </div>
        </div>
        <div className="h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
          <Clock className="h-7 w-7 text-amber-600" />
        </div>
      </m.div>

      {/* Properties Card - Emerald Gradient */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative group overflow-hidden bg-white/50 backdrop-blur-md border border-slate-200 rounded-[32px] p-8 shadow-sm flex items-center justify-between"
      >
        <div className="absolute top-0 right-0 h-full w-2 bg-emerald-500/10 group-hover:w-full transition-all duration-500 -z-10" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
            ทรัพย์เปิดขาย (Active Properties)
          </p>
          <h4 className="text-3xl font-semibold text-slate-900 leading-none">
            {propertyCount}
          </h4>
        </div>
        <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
          <Building2 className="h-7 w-7 text-emerald-600" />
        </div>
      </m.div>
    </div>
  );
}
