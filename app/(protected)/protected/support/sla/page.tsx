"use client";

import {
  ShieldCheck,
  Clock,
  Zap,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteConfig } from "@/lib/site-config";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Link from "next/link";

export default function SLAPage() {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="flex flex-col gap-6 p-4 pb-20 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {isEn ? "Service Level Agreement (SLA)" : "ข้อตกลงระดับการให้บริการ (SLA)"}
        </h1>
        <p className="text-slate-500 max-w-2xl">
          {isEn
            ? "Enterprise SLA terms, operational standards, and uptime guarantees for the platform."
            : "รายละเอียดเงื่อนไขการให้บริการ การันตีเวลาทำงาน และมาตรฐานการดูแลลูกค้าระดับองค์กร"}
        </p>
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
              {isEn ? "99.9% Uptime Guarantee" : "รับประกัน Uptime 99.9%"}
            </CardTitle>
            <CardDescription className="text-blue-700/70 font-medium">
              {isEn
                ? "Reliable enterprise infrastructure built for high availability"
                : "โครงสร้างพื้นฐานระดับองค์กรเพื่อความพร้อมใช้งานสูงสุด"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-slate-600 text-sm leading-relaxed">
              {isEn
                ? "We guarantee 99.9% monthly availability for all cloud services, databases, and APIs. In the event of unscheduled downtime, SLA credit compensation applies according to enterprise contract terms."
                : "เรารับประกันความพร้อมใช้งานของระบบไม่ต่ำกว่า 99.9% ต่อเดือน สำหรับบริการคลาวด์ ฐานข้อมูล และ API ทั้งหมด หากเกิดเหตุขัดข้องนอกเหนือเวลาบำรุงรักษา ระบบจะชดเชยตามข้อตกลง SLA ของสัญญา Enterprise"}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              {[
                isEn ? "High Availability Infrastructure" : "โครงสร้างพื้นฐาน High Availability",
                isEn ? "99.9% Monthly Uptime Guarantee" : "การันตี Uptime 99.9% รายเดือน",
                isEn ? "Redundant Server Clusters" : "คลัสเตอร์เซิร์ฟเวอร์แบบ Redundant",
                isEn ? "Automatic Failover Systems" : "ระบบ Failover สำรองอัตโนมัติ",
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
              {isEn ? "Fast Incident Response" : "การตอบรับเหตุฉุกเฉินรวดเร็ว"}
            </CardTitle>
            <CardDescription className="text-indigo-700/70 font-medium">
              {isEn
                ? "24/7 dedicated engineering and support team escalation"
                : "ทีมวิศวกรและฝ่ายบริการลูกค้าพร้อมดูแลตลอด 24 ชั่วโมง"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-slate-600 text-sm leading-relaxed">
              {isEn
                ? "Critical incidents receive priority engineering attention with initial triage within 15 minutes and direct technical coordination via dedicated channels."
                : "กรณีเกิดเหตุฉุกเฉินระดับวิกฤต ทีมงานจะตอบสนองและเริ่มตรวจสอบภายใน 15 นาที พร้อมประสานงานผ่านช่องทางพิเศษโดยตรงกับวิศวกรผู้ดูแลระบบ"}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              {[
                isEn ? "15-min Critical Incident Triage" : "เริ่มตรวจสอบเหตุฉุกเฉินภายใน 15 นาที",
                isEn ? "Dedicated Priority Channels" : "ช่องทางติดต่อด่วนพิเศษเฉพาะองค์กร",
                isEn ? "Fast-Track Ticketing System" : "ระบบแจ้งปัญหาแบบ Fast-Track",
                isEn ? "Crisis Management Escalation" : "ทีมบริหารจัดการสถานการณ์ฉุกเฉิน",
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

      {/* Additional Info Section */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="text-slate-400" size={20} />
            {isEn ? "Additional Details & Governance" : "ข้อมูลเพิ่มเติมและข้อกำหนด"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 text-sm">
              {isEn ? "Measurement & Monitoring" : "การวัดผล (Measurement)"}
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {isEn
                ? "We continuously monitor server health, latency, and uptime 24/7 across multiple independent global monitoring regions."
                : "เราใช้เครื่องมือ Monitor ระดับโลกเพื่อตรวจสอบสถานะเซิร์ฟเวอร์แบบเรียลไทม์ตลอด 24 ชั่วโมงจากหลายภูมิภาค"}
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 text-sm">
              {isEn ? "System Scope" : "ขอบเขต (Scope)"}
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {isEn
                ? `Covers the core CRM platform, backend REST/GraphQL APIs, and cloud database infrastructure of ${siteConfig.name}.`
                : `ครอบคลุมระบบ CRM, API และฐานข้อมูลทั้งหมดของ ${siteConfig.name}`}
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 text-sm">
              {isEn ? "Enterprise Reporting" : "รายงาน (Reporting)"}
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {isEn
                ? "Enterprise tier clients can request official monthly uptime audit reports directly through their dedicated account manager."
                : "ลูกค้ากลุ่ม Enterprise สามารถขอรายงาน Uptime ประจำเดือนได้ผ่านเจ้าหน้าที่ผู้ดูแลบัญชี"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl font-bold">
            {isEn ? "Need Additional Support?" : "ต้องการความช่วยเหลือเพิ่มเติม?"}
          </h3>
          <p className="text-slate-400 text-sm">
            {isEn
              ? "Our technical support team is always ready to assist your organization."
              : "ทีมงานของเราพร้อมดูแลคุณเสมอ ติดต่อเราได้ทันทีผ่านช่องทางด่วน"}
          </p>
        </div>
        <Link
          href={siteConfig.links.line || `tel:${siteConfig.contact.phone}`}
          target="_blank"
          className="bg-white text-slate-900 px-8 py-3 rounded-xl font-semibold hover:bg-slate-100 transition-colors shadow-sm text-sm shrink-0 cursor-pointer"
        >
          {isEn ? "Contact Support Team" : "ติดต่อทีม Support"}
        </Link>
      </div>
    </div>
  );
}
