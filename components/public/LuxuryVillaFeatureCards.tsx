"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { MapPin, Star, ShieldCheck, Award } from "lucide-react";

interface LuxuryVillaFeatureCardsProps {
  initialLanguage?: string;
}

export function LuxuryVillaFeatureCards({ initialLanguage }: LuxuryVillaFeatureCardsProps) {
  const { language: clientLanguage } = useLanguage();
  const language = clientLanguage || initialLanguage || "th";

  return (
    <section className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 mb-16 mt-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {/* Card 1: Prime Location */}
        <div className="group bg-slate-900/40 rounded-3xl border border-slate-800/80 p-6 flex flex-col shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 shrink-0">
            <MapPin className="h-5 w-5 text-amber-500" />
          </div>
          <h3 className="text-md font-bold text-white mb-2">
            {language === "en"
              ? "Exclusive Prime Locations"
              : language === "cn"
              ? "独家黄金地段"
              : language === "ru"
              ? "Эксклюзивные районы"
              : "ทำเลสุดเอ็กซ์คลูซีฟ"}
          </h3>
          <p className="text-xs font-medium text-slate-400 leading-relaxed flex-1">
            {language === "en"
              ? "Villas in Thailand's most prestigious locations, from Phuket beachfronts to Bangkok's ultra-luxury residential areas."
              : language === "cn"
              ? "泰国最负盛名的豪宅地段，从普吉岛海滩别墅到曼谷顶尖奢华住宅区。"
              : language === "ru"
              ? "Виллы в самых престижных местах Таиланда, от побережья Пхукета до элитных жилых районов Бангкока."
              : "วิลล่าหรูในทำเลที่ดีที่สุดของประเทศ ตั้งแต่ริมหาดเกาะภูเก็ตไปจนถึงโครงการคฤหาสน์ระดับห้าดาวในกรุงเทพฯ"}
          </p>
        </div>

        {/* Card 2: Five-Star Amenities */}
        <div className="group bg-slate-900/40 rounded-3xl border border-slate-800/80 p-6 flex flex-col shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 shrink-0">
            <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
          </div>

          <h3 className="text-md font-bold text-white mb-2">
            {language === "en"
              ? "Five-Star Amenities"
              : language === "cn"
              ? "五星级配套设施"
              : language === "ru"
              ? "Пятизвездочные удобства"
              : "สิ่งอำนวยความสะดวก 5 ดาว"}
          </h3>
          <p className="text-xs font-medium text-slate-400 leading-relaxed flex-1">
            {language === "en"
              ? "Private infinity-edge pools, customizable home theaters, private lifts, and spacious smart-home integrated layouts."
              : language === "cn"
              ? "私人无边泳池、定制家庭影院、室内电梯以及融入智能家居系统的宽阔户型。"
              : language === "ru"
              ? "Частные пейзажные бассейны, домашние кинотеатры, личные лифты и просторные планировки со смарт-системами."
              : "สระว่ายน้ำส่วนตัว (Infinity Pool) ห้องดูภาพยนตร์ส่วนตัว ลิฟต์ในบ้าน และพื้นที่ใช้สอยอัจฉริยะที่ออกแบบมาอย่างพิถีพิถัน"}
          </p>
        </div>

        {/* Card 3: High Security */}
        <div className="group bg-slate-900/40 rounded-3xl border border-slate-800/80 p-6 flex flex-col shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 shrink-0">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <h3 className="text-md font-bold text-white mb-2">
            {language === "en"
              ? "Uncompromised Privacy"
              : language === "cn"
              ? "极致私密与安全"
              : language === "ru"
              ? "Бескомпромиссная приватность"
              : "ความเป็นส่วนตัวและความปลอดภัย"}
          </h3>
          <p className="text-xs font-medium text-slate-400 leading-relaxed flex-1">
            {language === "en"
              ? "24/7 double-gate security system, advanced access control, CCTV monitoring, and absolute residential privacy."
              : language === "cn"
              ? "24/7 双重门禁安防系统、先进的准入控制、CCTV监控，保障绝对的居住隐私。"
              : language === "ru"
              ? "Круглосуточная охрана с двойными воротами, контроль доступа, видеонаблюдение и полная приватность жильцов."
              : "ระบบรักษาความปลอดภัยระดับสูงสุด ประตูเข้าออกสองชั้น กล้องวงจรปิดรอบด้าน และความเป็นส่วนตัวขั้นสุดของผูอยู่อาศัย"}
          </p>
        </div>

        {/* Card 4: Elite Lifestyle */}
        <div className="group bg-slate-900/40 rounded-3xl border border-slate-800/80 p-6 flex flex-col shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 shrink-0">
            <Award className="h-5 w-5 text-amber-500" />
          </div>
          <h3 className="text-md font-bold text-white mb-2">
            {language === "en"
              ? "Elite Villa Management"
              : language === "cn"
              ? "尊享别墅管理服务"
              : language === "ru"
              ? "Элитное управление виллами"
              : "การจัดการและบริการระดับพรีเมียม"}
          </h3>
          <p className="text-xs font-medium text-slate-400 leading-relaxed flex-1">
            {language === "en"
              ? "Access to professional property management, private chefs, butler services, and VIP residential support."
              : language === "cn"
              ? "提供专业物业托管、私人大厨、管家服务以及 VIP 级生活助理与支持。"
              : language === "ru"
              ? "Доступ к профессиональному управлению недвижимостью, услугам личных шеф-поваров, дворецких и VIP-поддержке."
              : "ยกระดับการอยู่อาศัยด้วยบริการดูแลบ้านระดับพรีเมียม เชฟส่วนตัว และทีมงานบริหารความสะดวกสบายส่วนตัว"}
          </p>
        </div>
      </div>
    </section>
  );
}
