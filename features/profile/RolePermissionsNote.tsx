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
      title: "ADMIN (แอดมินระบบส่วนกลาง)",
      icon: <Shield className="h-4 w-4 text-rose-600" />,
      desc: "ผู้ดูแลระบบสูงสุด: สิทธิ์สูงสุดและข้ามสาขาได้อิสระ 100% (Bypass RLS) ควบคุมดูแลโครงสร้างพื้นฐานระบบ, ข้อมูล Master Data, อนุมัติการสร้างสาขาใหม่ และจัดการคดีข้อพิพาทข้ามสาขา",
      color: "bg-rose-50 border-rose-100",
    },
    {
      title: "OWNER (เจ้าของสาขา)",
      icon: <Shield className="h-4 w-4 text-indigo-600" />,
      desc: "เจ้าของสาขา: สิทธิ์สูงสุดภายในสาขา (Tenant) ของตนเอง บริหารจัดการสมาชิกทีมขาย, เข้าถึงรายงานธุรกิจ/คอมมิชชันรวมของสาขา, และมีสิทธิ์ขาดในการอนุมัติธุรกรรมและโอนย้ายทรัพย์/ลีดข้ามสาขาทันที",
      color: "bg-indigo-50 border-indigo-100",
    },
    {
      title: "MANAGER (ผู้จัดการ)",
      icon: <Users className="h-4 w-4 text-amber-600" />,
      desc: "ผู้จัดการสาขา: ควบคุมพนักงานและการปฏิบัติงานประจำวันภายในสาขา ควบคุมและตรวจสอบการทำงานของเอเจนต์, อนุมัติข้อมูลทรัพย์ให้เผยแพร่สาธารณะ, และโอนย้ายทรัพย์/ลีดข้ามสาขาได้ทันที",
      color: "bg-amber-50 border-amber-100",
    },
    {
      title: "AGENT (ตัวแทน)",
      icon: <User className="h-4 w-4 text-emerald-600" />,
      desc: "ตัวแทนขาย: ดูแลจัดการทรัพย์สิน ลูกค้า และดีลเฉพาะที่ได้รับมอบหมายภายในสาขาเท่านั้น ค้นหาทรัพย์และลูกค้าด้วย AI Smart Match และส่งคำขอเสนอส่งต่อเคสข้ามสาขา (Referral Request) พร้อมใส่เหตุผล",
      color: "bg-emerald-50 border-emerald-100",
    },
    {
      title: "USER (ผู้ใช้งานทั่วไป)",
      icon: <Key className="h-4 w-4 text-slate-600" />,
      desc: "ลูกค้า / ผู้ใช้ทั่วไปหน้าบ้าน: ฝั่งหน้าเว็บสาธารณะ (Public Portal) ค้นหาและดูรายละเอียดทรัพย์สินที่อนุมัติเผยแพร่, ลงทะเบียนสมัครสมาชิก, ไม่มีสิทธิ์ล็อกอินเข้าสู่ระบบหลังบ้าน (Dashboard)",
      color: "bg-slate-50 border-slate-100",
    },
  ];

  const permissionMatrix = [
    { feature: "สลับดูข้อมูลทุกสาขา (Global Switcher)", admin: true, owner: false, manager: false, agent: false, user: false },
    { feature: "ตั้งค่าระบบส่วนกลาง (Global Settings)", admin: true, owner: false, manager: false, agent: false, user: false },
    { feature: "อนุมัติเปิดสาขาใหม่ (Approve Tenant)", admin: true, owner: false, manager: false, agent: false, user: false },
    { feature: "จัดการทีมงานและตำแหน่งในสาขา", admin: true, owner: true, manager: false, agent: false, user: false },
    { feature: "ดูรายงานการเงินรวมของสาขา", admin: true, owner: true, manager: true, agent: false, user: false },
    { feature: "โอนย้ายทรัพย์/ลีดข้ามสาขาทันที (Instant Transfer)", admin: true, owner: true, manager: true, agent: false, user: false },
    { feature: "ส่งคำขอโอนย้ายข้ามสาขา (Referral Request)", admin: false, owner: false, manager: false, agent: true, user: false },
    { feature: "จัดการทรัพย์/ลีด/ดีล ภายในสาขา", admin: true, owner: true, manager: true, agent: true, user: false },
    { feature: "ดูข้อมูลหน้าบ้านสาธารณะ (Public Search)", admin: true, owner: true, manager: true, agent: true, user: true },
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
                  {role.title.includes("OWNER") && (
                    <>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100/50 text-[9px] font-semibold text-indigo-700 uppercase">Branch Admin</span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100/50 text-[9px] font-semibold text-indigo-700 uppercase">Member Management</span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100/50 text-[9px] font-semibold text-indigo-700 uppercase">Branch Reports</span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100/50 text-[9px] font-semibold text-indigo-700 uppercase">Instant Transfer</span>
                    </>
                  )}
                  {role.title.includes("ADMIN") && (
                    <>
                      <span className="px-2 py-0.5 rounded-md bg-rose-100/50 text-[9px] font-semibold text-rose-700 uppercase">Cross-branch Management</span>
                      <span className="px-2 py-0.5 rounded-md bg-rose-100/50 text-[9px] font-semibold text-rose-700 uppercase">System Config</span>
                      <span className="px-2 py-0.5 rounded-md bg-rose-100/50 text-[9px] font-semibold text-rose-700 uppercase">Global Audit</span>
                    </>
                  )}
                  {role.title.includes("MANAGER") && (
                    <>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100/50 text-[9px] font-semibold text-amber-700 uppercase">Branch Approval</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100/50 text-[9px] font-semibold text-amber-700 uppercase">Team Report</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100/50 text-[9px] font-semibold text-amber-700 uppercase">Instant Transfer</span>
                    </>
                  )}
                  {role.title.includes("AGENT") && (
                    <>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100/50 text-[9px] font-semibold text-emerald-700 uppercase">Property Listing</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100/50 text-[9px] font-semibold text-emerald-700 uppercase">Lead Management</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100/50 text-[9px] font-semibold text-emerald-700 uppercase">Referral Request</span>
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

        {/* 📊 Permissions Matrix Table */}
        <div className="border-t border-slate-100 p-6 bg-slate-50/30">
          <h4 className="font-semibold text-sm text-slate-900 mb-4 flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-500" />
            ตารางเปรียบเทียบสิทธิ์รายตำแหน่ง
          </h4>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="p-3">ขอบเขตงาน / ฟังก์ชัน</th>
                  <th className="p-3 text-center">ADMIN</th>
                  <th className="p-3 text-center">OWNER</th>
                  <th className="p-3 text-center">MANAGER</th>
                  <th className="p-3 text-center">AGENT</th>
                  <th className="p-3 text-center">USER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {permissionMatrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-semibold text-slate-800">{row.feature}</td>
                    <td className="p-3 text-center">
                      {row.admin ? (
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-rose-50 text-rose-600 font-bold">✓</span>
                      ) : (
                        <span className="text-slate-350">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {row.owner ? (
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-indigo-50 text-indigo-600 font-bold">✓</span>
                      ) : (
                        <span className="text-slate-350">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {row.manager ? (
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-50 text-amber-600 font-bold">✓</span>
                      ) : (
                        <span className="text-slate-350">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {row.agent ? (
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 font-bold">✓</span>
                      ) : (
                        <span className="text-slate-350">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {row.user ? (
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-slate-100 text-slate-600 font-bold">✓</span>
                      ) : (
                        <span className="text-slate-350">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
