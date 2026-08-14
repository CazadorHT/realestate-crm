"use client";

import { Sparkles, ShieldCheck, MapPin } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface PropertiesHeroBannerProps {
  initialLanguage?: string;
}

export function PropertiesHeroBanner({ initialLanguage }: PropertiesHeroBannerProps) {
  const { language: clientLanguage } = useLanguage();
  const language = clientLanguage || initialLanguage || "th";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/10 px-4 py-1.5 text-sm font-medium text-blue-800">
        <Sparkles className="h-3.5 w-3.5 text-blue-700" />
        <span>
          {language === "en"
            ? "Exclusive Thailand Real Estate"
            : language === "cn"
            ? "泰国精选高端房源"
            : language === "ru"
            ? "Эксклюзивная недвижимость в Таиланде"
            : "แหล่งรวมอสังหาริมทรัพย์ระดับพรีเมียม"}
        </span>
      </div>

      <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl leading-tight">
        {language === "en"
          ? "Find Your Dream"
          : language === "cn"
          ? "寻找您的梦想"
          : language === "ru"
          ? "Найдите дом вашей"
          : "ค้นหาอสังหาริมทรัพย์"}{" "}
        <br className="hidden md:inline" />
        <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-700 to-indigo-700">
          {language === "en"
            ? "Property in Thailand"
            : language === "cn"
            ? "泰国精选房产"
            : language === "ru"
            ? "мечты в Таиланде"
            : "ที่ตอบโจทย์ไลฟ์สไตล์คุณ"}
        </span>
      </h1>

      <p className="text-base text-slate-600 md:text-lg leading-relaxed font-medium">
        {language === "en"
          ? "Discover a wide range of handpicked condos, luxury villas, houses, and premium commercial offices for sale and rent in Bangkok and major locations."
          : language === "cn"
          ? "为您精选曼谷及各大热门地段的公寓、豪宅、独栋别墅和优质写字楼，提供买卖与租赁服务。"
          : language === "ru"
          ? "Откройте для себя широкий выбор отобранных кондоминиумов, роскошных вилл, домов и премиальных офисов для покупки и аренды в Бангкоке и других ключевых локациях."
          : "ค้นหาคอนโด บ้านเดี่ยว ทาวน์โฮม วิลล่าหรู และพื้นที่สำนักงานให้เช่าคัดสรรพิเศษครอบคลุมพื้นที่กรุงเทพฯ และแหล่งท่องเที่ยวสำคัญ"}
      </p>

      <div className="flex flex-wrap gap-4 pt-2">
        <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm font-medium text-slate-700 shadow-2xs">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>
            {language === "en"
              ? "Verified Listings"
              : language === "cn"
              ? "已认证房源"
              : language === "ru"
              ? "Проверенные объекты"
              : "ประกาศตรวจสอบแล้ว"}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm font-medium text-slate-700 shadow-2xs">
          <MapPin className="h-4 w-4 text-indigo-600" />
          <span>
            {language === "en"
              ? "Prime CBD & Transit Near"
              : language === "cn"
              ? "黄金地段 & 临近轨道交通"
              : language === "ru"
              ? "Центральные районы и метро"
              : "ใกล้รถไฟฟ้าและทำเลทอง"}
          </span>
        </div>
      </div>
    </div>
  );
}
