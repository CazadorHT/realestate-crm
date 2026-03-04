import { Metadata } from "next";
import {
  ShieldCheck,
  Clock,
  Zap,
  CheckCircle2,
  HelpCircle,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getServerTranslations } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "SLA Agreement | Service Level Agreement",
  description: "รายละเอียดข้อตกลงระดับการให้บริการ (SLA) และการันตีคุณภาพระบบ",
};

export default async function SLAPage() {
  const { t } = await getServerTranslations();

  return (
    <div className="flex flex-col gap-6 p-4 pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {t("support.sla.title")}
        </h1>
        <p className="text-slate-500 max-w-2xl">{t("support.desc")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Uptime Guarantee Card */}
        <Card className="border-blue-100 bg-blue-50/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap size={120} className="text-blue-600" />
          </div>
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
              <ShieldCheck className="text-white" size={24} />
            </div>
            <CardTitle className="text-2xl text-blue-900">
              {t("support.sla.uptime_title")}
            </CardTitle>
            <CardDescription className="text-blue-700/70 font-medium">
              {t("support.sla.uptime_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-slate-600 text-sm leading-relaxed">
              {t("support.sla.uptime_detail")}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              {[
                "High Availability Infrastructure",
                "99.9% Monthly Uptime Guarantee",
                "Redundant Server Clusters",
                "Automatic Failover Systems",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <CheckCircle2 size={16} className="text-blue-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Response Time Card */}
        <Card className="border-indigo-100 bg-indigo-50/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock size={120} className="text-indigo-600" />
          </div>
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
              <Clock className="text-white" size={24} />
            </div>
            <CardTitle className="text-2xl text-indigo-900">
              {t("support.sla.response_title")}
            </CardTitle>
            <CardDescription className="text-indigo-700/70 font-medium">
              {t("support.sla.response_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-slate-600 text-sm leading-relaxed">
              {t("support.sla.response_detail")}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              {[
                "4 Hours Initial Response Time",
                "Dedicated Support Channels",
                "Ticketing System Priority",
                "Crisis Management Team",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <CheckCircle2 size={16} className="text-indigo-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info / FAQ Section */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="text-slate-400" size={20} />
            ข้อมูลเพิ่มเติม
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900">
              การวัดผล (Measurement)
            </h4>
            <p className="text-sm text-slate-500">
              เรามีการใช้เครื่องมือ Monitor
              ระดับโลกเพื่อตรวจสอบสถานะเซิร์ฟเวอร์แบบเรียลไทม์ตลอด 24 ชั่วโมง
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900">ขอบเขต (Scope)</h4>
            <p className="text-sm text-slate-500">
              ครอบคลุมระบบ CRM, API และฐานข้อมูลทั้งหมดของ VC Connect Asset
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900">รายงาน (Reporting)</h4>
            <p className="text-sm text-slate-500">
              ลูกค้ากลุ่ม Enterprise สามารถขอรายงาน Uptime
              ประจำเดือนได้ผ่านเจ้าหน้าที่
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="bg-slate-900 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl font-bold">ต้องการความช่วยเหลือเพิ่มเติม?</h3>
          <p className="text-slate-400">
            ทีมงานของเราพร้อมดูแลคุณเสมอ ติดต่อเราได้ทันทีผ่านช่องทางด่วน
          </p>
        </div>
        <button className="bg-white text-slate-900 px-8 py-3 rounded-xl font-semibold hover:bg-slate-100 transition-colors">
          ติดต่อทีม Support
        </button>
      </div>
    </div>
  );
}
