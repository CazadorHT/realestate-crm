"use client";

import { Info, Shield, Users, User, Key, Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RolePermissionsNote() {
  const roles = [
    {
      title: "ADMIN (แอดมิน)",
      icon: <Shield className="h-4 w-4 text-rose-600" />,
      desc: "สิทธิ์สูงสุด เข้าถึงข้อมูลได้ทุกสาขา จัดการสมาชิก และตั้งค่าระบบทั้งหมด",
      color: "bg-rose-50 border-rose-100",
    },
    {
      title: "MANAGER (ผู้จัดการ)",
      icon: <Users className="h-4 w-4 text-amber-600" />,
      desc: "จัดการข้อมูลภายในสาขาที่สังกัด ดูรายงานสาขา และอนุมัติรายการดีล/สัญญา",
      color: "bg-amber-50 border-amber-100",
    },
    {
      title: "AGENT (ตัวแทน)",
      icon: <User className="h-4 w-4 text-emerald-600" />,
      desc: "จัดการทรัพย์สินและลีดในสาขาที่สังกัดตามที่ได้รับมอบหมาย",
      color: "bg-emerald-50 border-emerald-100",
    },
    {
      title: "USER (ผู้ใช้งานทั่วไป)",
      icon: <Key className="h-4 w-4 text-slate-600" />,
      desc: "เข้าถึงข้อมูลส่วนตัวและรายการที่เกี่ยวข้องกับตนเองเท่านั้น",
      color: "bg-slate-50 border-slate-100",
    },
  ];

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
           <div className="p-1.5 rounded-lg bg-slate-900 text-white">
             <Key className="h-4 w-4" />
           </div>
           <div>
             <CardTitle className="text-base font-semibold text-slate-900">อธิบายสิทธิ์การใช้งาน</CardTitle>
             <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
               Role & Permissions Guide
             </CardDescription>
           </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col">
          {roles.map((role, i) => (
            <motion.div 
              key={i} 
              whileHover={{ backgroundColor: "rgba(255,255,255,0.8)" }}
              className={cn(
                "p-4 flex gap-4 transition-all duration-300 border-b border-slate-50 last:border-0",
                role.color
              )}
            >
              <div className="mt-0.5 relative">
                <div className="p-2 rounded-xl bg-white shadow-sm border border-slate-100 italic">
                  {role.icon}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900 tracking-tight">{role.title}</span>
                  <div className="h-1 w-1 rounded-full bg-slate-300" />
                  <div className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Active</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  {role.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
