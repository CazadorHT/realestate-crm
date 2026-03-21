import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info, Shield, Users, User, Key } from "lucide-react";

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
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-slate-600" />
          <CardTitle className="text-lg font-semibold text-slate-900">อธิบายสิทธิ์การใช้งาน (Roles)</CardTitle>
        </div>
        <CardDescription className="text-slate-500">
          ข้อมูลสรุปสิทธิ์และหน้าที่ของแต่ละบทบาทในระบบ
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {roles.map((role, i) => (
            <div key={i} className={`p-4 flex gap-4 ${role.color}`}>
              <div className="mt-1">{role.icon}</div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-900">{role.title}</div>
                <div className="text-xs text-slate-600 leading-relaxed">{role.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
