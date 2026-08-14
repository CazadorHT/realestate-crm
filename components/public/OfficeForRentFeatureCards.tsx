"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { MapPin, Briefcase, ShieldCheck, Sparkles } from "lucide-react";

interface OfficeForRentFeatureCardsProps {
  initialLanguage?: string;
}

export function OfficeForRentFeatureCards({ initialLanguage }: OfficeForRentFeatureCardsProps) {
  const { language: clientLanguage } = useLanguage();
  const language = clientLanguage || initialLanguage || "th";

  return (
    <section className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 mb-16 mt-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {/* Card 1: Prime CBD */}
        <div className="group bg-white rounded-3xl border border-slate-100/80 p-6 flex flex-col shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center mb-4 shrink-0">
            <MapPin className="h-5 w-5 text-blue-700" />
          </div>
          <h3 className="text-md font-bold text-slate-800 mb-2">
            {language === "en"
              ? "Prime CBD Locations"
              : language === "cn"
              ? "核心商业区黄金地段"
              : language === "ru"
              ? "Престижные районы CBD"
              : "ทำเลศักยภาพ (Prime CBD)"}
          </h3>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed flex-1">
            {language === "en"
              ? "Office spaces in premium business hubs like Sathorn, Silom, Asoke, and Ratchada near BTS/MRT stations."
              : language === "cn"
              ? "位于沙吞、席隆、阿索克和拉差达等高端商业枢纽的写字楼，邻近 BTS/MRT 轨道交通站。"
              : language === "ru"
              ? "Офисы в престижных деловых центрах, таких как Саторн, Силом, Асок и Рачада, рядом со станциями BTS/MRT."
              : "ออฟฟิศให้เช่าในย่านธุรกิจหลัก เช่น สาทร, สีลม, อโศก, รัชดาภิเษก ติดรถไฟฟ้า BTS/MRT เดินทางสะดวกพนักงานแฮปปี้"}
          </p>
        </div>

        {/* Card 2: Startup Home Office */}
        <div className="group bg-white rounded-3xl border border-slate-100/80 p-6 flex flex-col shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 flex items-center justify-center mb-4 shrink-0">
            <Briefcase className="h-5 w-5 text-indigo-700" />
          </div>
          <h3 className="text-md font-bold text-slate-800 mb-2">
            {language === "en"
              ? "Startup Home Office"
              : language === "cn"
              ? "创业首选商住两用楼"
              : language === "ru"
              ? "Домашние офисы для стартапов"
              : "โฮมออฟฟิศสร้างตัว (Home Office)"}
          </h3>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed flex-1">
            {language === "en"
              ? "Spacious home offices perfect for startups and SMEs looking for privacy, parking spaces, and corporate registration."
              : language === "cn"
              ? "宽敞的商住两用楼（Home Office），非常适合需要私密性、停车位以及支持企业地址注册的初创公司和中小企业。"
              : language === "ru"
              ? "Просторные домашние офисы для стартапов и малого бизнеса, требующих приватности, парковки и юр. адреса."
              : "โฮมออฟฟิศให้เช่าพื้นที่กว้างขวาง เหมาะกับสตาร์ทอัพและ SMEs ที่ต้องการความเป็นส่วนตัว มีที่จอดรถ และจดทะเบียนบริษัทได้"}
          </p>
        </div>

        {/* Card 3: 100% Registered Address */}
        <div className="group bg-white rounded-3xl border border-slate-100/80 p-6 flex flex-col shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 flex items-center justify-center mb-4 shrink-0">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
          </div>
          <h3 className="text-md font-bold text-slate-800 mb-2">
            {language === "en"
              ? "100% Registered Address"
              : language === "cn"
              ? "支持 100% 公司地址注册"
              : language === "ru"
              ? "100% Регистрация юр. адреса"
              : "จดทะเบียนบริษัทได้ 100%"}
          </h3>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed flex-1">
            {language === "en"
              ? "Carefully curated commercial spaces that support legal business address registration to kickstart your operations."
              : language === "cn"
              ? "精心挑选的商业空间，支持合法企业营业执照地址注册，助力您的业务顺利起步。"
              : language === "ru"
              ? "Тщательно подобранные коммерческие площади с возможностью законной регистрации юридического адреса."
              : "คัดสรรอาคารพาณิชย์และออฟฟิศที่รองรับการจดทะเบียนบริษัท ช่วยให้คุณเริ่มต้นดำเนินธุรกิจได้อย่างถูกต้องตามกฎหมายอย่างไร้กังวล"}
          </p>
        </div>

        {/* Card 4: Premium Facilities */}
        <div className="group bg-white rounded-3xl border border-slate-100/80 p-6 flex flex-col shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="w-10 h-10 rounded-2xl bg-amber-600/10 flex items-center justify-center mb-4 shrink-0">
            <Sparkles className="h-5 w-5 text-amber-700" />
          </div>
          <h3 className="text-md font-bold text-slate-800 mb-2">
            {language === "en"
              ? "Premium Facilities"
              : language === "cn"
              ? "一流优质商务配套"
              : language === "ru"
              ? "Премиум инфраструктура"
              : "สิ่งอำนวยความสะดวกครบครัน"}
          </h3>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed flex-1">
            {language === "en"
              ? "Grade A buildings and business centers featuring 24/7 security, CCTV, visitor parking, and premium shared amenities."
              : language === "cn"
              ? "甲级写字楼及高档商务中心，配有 24 小时全天候安防、CCTV监控、访客停车场和优质的共享设施。"
              : language === "ru"
              ? "Здания класса А и бизнес-центры с круглосуточной охраной, видеонаблюдением, парковкой и общими зонами."
              : "อาคารเกรด A และบีบิสซิเนสเซ็นเตอร์ที่มีระบบรักษาความปลอดภัย 24 ชม., กล้อง CCTV, พื้นที่จอดรถรองรับลูกค้า และพื้นที่ส่วนกลางระดับพรีเมียม"}
          </p>
        </div>
      </div>
    </section>
  );
}
