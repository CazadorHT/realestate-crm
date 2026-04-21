"use client";

import { Info, Shield, Users, User, Key, Check } from "lucide-react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function RolePermissionsNote() {
  const roles = [
    {
      title: "ADMIN (แอดมิน)",
      icon: <Shield className="h-4 w-4 text-rose-600" />,
      desc: "ผู้ดูแลพื้นฐานระบบสูงสุด: มีอำนาจสูงสุดในการบริหารจัดการสมาชิกทุกสาขา, กำหนดโครงสร้างองค์กร, ตรวจสอบธุรกรรมทางการเงิน และตั้งค่าความปลอดภัยของข้อมูลทั้งหมดในระบบ",
      color: "bg-rose-50 border-rose-100",
    },
    {
      title: "MANAGER (ผู้จัดการ)",
      icon: <Users className="h-4 w-4 text-amber-600" />,
      desc: "ผู้จัดการสาขา / หัวหน้าทีม: รับผิดชอบการบริหารจัดการทรัพย์สินและทีมงานภายในสาขา, อนุมัติเคสและสัญญา, ตรวจสอบรายงานยอดขาย และดูแลภาพรวมความถูกต้องของข้อมูลในเขตที่ดูแล",
      color: "bg-amber-50 border-amber-100",
    },
    {
      title: "AGENT (ตัวแทน)",
      icon: <User className="h-4 w-4 text-emerald-600" />,
      desc: "ตัวแทนอสังหาริมทรัพย์: มีหน้าที่หลักในการจัดการทรัพย์สิน (Properties) และผู้เช่า/ผู้ซื้อ (Leads), สร้างรายการประกาศ, ดำเนินงานขายและประสานงานกับลูกค้าในสาขาที่ได้รับมอบหมาย",
      color: "bg-emerald-50 border-emerald-100",
    },
    {
      title: "USER (ผู้ใช้งานทั่วไป)",
      icon: <Key className="h-4 w-4 text-slate-600" />,
      desc: "ผู้ใช้งานทั่วไป / ทีมสนับสนุน: เข้าถึงฟีเจอร์พื้นฐานเพื่อติดตามสถานะงานที่เกี่ยวข้อง, ดูข้อมูลส่วนตัว และดำเนินกิจกรรมเบื้องต้นตามขอบเขตงานที่ได้รับอนุญาตจากแอดมิน",
      color: "bg-slate-50 border-slate-100",
    },
  ];

  return (
    <Card className="border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden bg-white/80 backdrop-blur-md rounded-3xl">
      <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
            <Key className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900 tracking-tight">
              โครงสร้างระดับสมาชิก
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-semibold tracking-[0.2em] text-slate-400">
              Role & Permissions Architecture
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col">
          {roles.map((role, i) => (
            <m.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ backgroundColor: "rgba(255,255,255,1)", x: 4 }}
              className={cn(
                "p-5 flex gap-5 transition-all duration-300 border-b border-slate-50 last:border-0 relative group",
                role.color,
              )}
            >
              {/* Left Accent Bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-current opacity-20 group-hover:opacity-100 transition-opacity" />

              <div className="mt-1 shrink-0">
                <div className="p-3 rounded-2xl bg-white shadow-md border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                  {role.icon}
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 tracking-tight">
                      {role.title}
                    </span>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[9px] font-semibold text-emerald-600 uppercase border border-emerald-100/50">
                      <Check className="h-2.5 w-2.5" />
                      Active
                    </div>
                  </div>
                </div>

                <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
                  {role.desc}
                </p>

                {/* Capabilities Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {role.title.includes("ADMIN") && (
                    <>
                      <span className="px-2 py-0.5 rounded-md bg-rose-100/50 text-[9px] font-semibold text-rose-700 uppercase">System Config</span>
                      <span className="px-2 py-0.5 rounded-md bg-rose-100/50 text-[9px] font-semibold text-rose-700 uppercase">User Management</span>
                      <span className="px-2 py-0.5 rounded-md bg-rose-100/50 text-[9px] font-semibold text-rose-700 uppercase">Financial Audit</span>
                    </>
                  )}
                  {role.title.includes("MANAGER") && (
                    <>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100/50 text-[9px] font-semibold text-amber-700 uppercase">Branch Approval</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100/50 text-[9px] font-semibold text-amber-700 uppercase">Team Report</span>
                    </>
                  )}
                  {role.title.includes("AGENT") && (
                    <>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100/50 text-[9px] font-semibold text-emerald-700 uppercase">Property Listing</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100/50 text-[9px] font-semibold text-emerald-700 uppercase">Lead Management</span>
                    </>
                  )}
                  {role.title.includes("USER") && (
                    <>
                      <span className="px-2 py-0.5 rounded-md bg-slate-200/50 text-[9px] font-semibold text-slate-600 uppercase">Personal View</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-200/50 text-[9px] font-semibold text-slate-600 uppercase">Basic Operation</span>
                    </>
                  )}
                </div>
              </div>
            </m.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
