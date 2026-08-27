"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Train, TrendingUp, Sparkles } from "lucide-react";
import { FaCity } from "react-icons/fa6";

interface PrimeCbdFeatureCardsProps {
  initialLanguage?: string;
}

export function PrimeCbdFeatureCards({ initialLanguage }: PrimeCbdFeatureCardsProps) {
  const { language: clientLanguage } = useLanguage();
  const language = clientLanguage || initialLanguage || "th";

  const features = [
    {
      icon: FaCity,
      badge: language === "en" ? "Core Hub" : language === "cn" ? "核心商务" : language === "ru" ? "Главный центр" : "ศูนย์กลางธุรกิจ",
      title:
        language === "en"
          ? "Premier Business District"
          : language === "cn"
          ? "甲级地标商务商圈"
          : language === "ru"
          ? "Престижный деловой район"
          : "ย่านธุรกิจและสำนักงานเกรด A",
      description:
        language === "en"
          ? "Surrounded by multinational corporate headquarters, luxury embassies, and iconic Grade A office towers."
          : language === "cn"
          ? "汇聚跨国名企总部、使馆区及高端甲级写字楼，商业价值卓越。"
          : language === "ru"
          ? "Окружение штаб-квартир международных компаний, посольств и башен класса А."
          : "ศูนย์รวมสำนักงานใหญ่ บริษัทข้ามชาติ สถานทูต และอาคารออฟฟิศชั้นนำระดับประเทศ",
    },
    {
      icon: Train,
      badge: language === "en" ? "Transit Hub" : language === "cn" ? "立体交通" : language === "ru" ? "Транспорт" : "เดินทางสะดวก",
      title:
        language === "en"
          ? "Seamless Transit Network"
          : language === "cn"
          ? "无缝接驳轨交路网"
          : language === "ru"
          ? "Удобный доступ к метро"
          : "ติดรถไฟฟ้า BTS & MRT",
      description:
        language === "en"
          ? "Direct connection to major BTS Skytrain, MRT Subway lines, Airport Rail Link, and expressway ramps."
          : language === "cn"
          ? "直通BTS轻轨、MRT地铁干线及高速公路匝道，出行便捷通达全城。"
          : language === "ru"
          ? "Прямой доступ к станциям BTS Skytrain, MRT и скоростным автомагистралям."
          : "เดินทางสะดวกรวดเร็ว ใกล้สถานีรถไฟฟ้าสายสีเขียว สายสีน้ำเงิน และจุดขึ้นลงทางด่วน",
    },
    {
      icon: TrendingUp,
      badge: language === "en" ? "Investment" : language === "cn" ? "投资价值" : language === "ru" ? "Инвестиции" : "ผลตอบแทนสูง",
      title:
        language === "en"
          ? "Strong Rental Yield & Value"
          : language === "cn"
          ? "稳定租金回报与增值"
          : language === "ru"
          ? "Высокая доходность от аренды"
          : "ผลตอบแทนและมูลค่าเติบโตสูง",
      description:
        language === "en"
          ? "High occupancy rates with strong demand from expatriates, corporate executives, and high-net-worth tenants."
          : language === "cn"
          ? "庞大的高净值外籍及高管租客群体，提供4-6%稳定租金回报与资本增值。"
          : language === "ru"
          ? "Стабильный спрос со стороны экспатов и топ-менеджеров с доходностью 4-6% в год."
          : "ผู้เช่าระดับผู้บริหารและ Expat หนาแน่น อัตราผลตอบแทนค่าเช่า 4-6% และ Capital Gain มั่นคง",
    },
    {
      icon: Sparkles,
      badge: language === "en" ? "Lifestyle" : language === "cn" ? "顶奢生活" : language === "ru" ? "Стиль жизни" : "ไลฟ์สไตล์หรู",
      title:
        language === "en"
          ? "World-Class Living & Amenities"
          : language === "cn"
          ? "世界级顶奢商业与医疗"
          : language === "ru"
          ? "Инфраструктура мирового уровня"
          : "แหล่งไลฟ์สไตล์ระดับเวิลด์คลาส",
      description:
        language === "en"
          ? "Steps away from premier luxury malls, Michelin-starred restaurants, international hospitals, and elite schools."
          : language === "cn"
          ? "紧邻顶级奢华商场、米其林星级餐厅、国际顶尖医院及知名私立名校。"
          : language === "ru"
          ? "В шаговой доступности от ТЦ, мишленовских ресторанов и международных клиник."
          : "ใกล้ศูนย์การค้าระดับโลก ร้านอาหารมิชลิน โรงพยาบาลชั้นนำ และโรงเรียนนานาชาติ",
    },
  ];

  return (
    <section className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 mb-16 mt-8 animate-fade-in-up delay-100">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600">
          {language === "en"
            ? "Why Choose Bangkok CBD & New CBD?"
            : language === "cn"
            ? "为什么选择曼谷CBD与新CBD地标房产？"
            : language === "ru"
            ? "Почему выбирают недвижимость в CBD Бангкока?"
            : "จุดเด่นของอสังหาริมทรัพย์ทำเล CBD & New CBD"}
        </h2>
        <p className="text-slate-500 font-medium text-xs md:text-sm leading-relaxed">
          {language === "en"
            ? "Discover unmatched urban prestige, convenience, and enduring investment value in Bangkok's prime centers."
            : language === "cn"
            ? "尽享曼谷核心都市圈尊贵生活、无与伦比的出行便捷与长青资产价值。"
            : language === "ru"
            ? "Откройте для себя престиж, удобство и высокую ценность жизни в сердце Бангкока."
            : "ศูนย์รวมความสะดวกสบาย ไลฟ์สไตล์ระดับพรีเมียม และมูลค่าการลงทุนที่เติบโตอย่างมั่นคง"}
        </p>
      </div>

      {/* Features 4-Column Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div
              key={idx}
              className="group bg-white rounded-3xl border border-slate-200 p-6 flex flex-col  shadow-2xs hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/30 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            >
              {/* Corner Soft Ambient Glow */}
              <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-emerald-500/20 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-emerald-500/30 pointer-events-none" />

              <div className="flex items-center justify-between mb-4 z-10">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-2xs">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50/90 px-2.5 py-1 rounded-full border border-emerald-100/70">
                  {feat.badge}
                </span>
              </div>

              <div className="space-y-2 flex-1 flex flex-col z-10">
                <h3 className="text-base font-bold text-slate-800 leading-snug group-hover:text-emerald-700 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-xs font-normal text-slate-500 leading-relaxed flex-1">
                  {feat.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
