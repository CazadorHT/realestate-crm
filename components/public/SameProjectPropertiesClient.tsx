"use client";

import Link from "next/link";
import { ArrowRight, Building2, Layers } from "lucide-react";
import { PropertyCard, PropertyCardProps } from "./PropertyCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { updateAIScore } from "@/lib/analytics-utils";
import { parseBilingualProjectName } from "@/lib/utils/project-name-utils";

interface SameProjectPropertiesClientProps {
  properties: PropertyCardProps[];
  projectName?: string | null;
  projectNameEn?: string | null;
  projectSlug?: string | null;
  propertyType?: string | null;
  compareData?: {
    price: number | null;
    size: number | null;
    date: string | null;
  };
}

export function SameProjectPropertiesClient({
  properties,
  projectName,
  projectNameEn,
  projectSlug,
  propertyType,
  compareData,
}: SameProjectPropertiesClientProps) {
  const { langPrefix, language } = useLanguage();

  if (!properties || properties.length === 0) return null;

  // ตัดภาษาอังกฤษที่อาจปนอยู่ในชื่อโครงการภาษาไทย และแยกภาษาอังกฤษออกมาไว้อีกบรรทัด
  const { cleanTh, cleanEn } = parseBilingualProjectName(projectName, projectNameEn);
  const displayProjectName = language === "th" ? (cleanTh || cleanEn) : (cleanEn || cleanTh);

  const propertyTypeLabel = (() => {
    if (!propertyType) return "";
    const tMap: Record<string, Record<string, string>> = {
      CONDO: { th: "คอนโดมิเนียม", en: "Condominium", cn: "公寓", ru: "Кондоминиум" },
      HOUSE: { th: "บ้านเดี่ยว", en: "Single House", cn: "独栋别墅", ru: "Дом" },
      TOWNHOME: { th: "ทาวน์โฮม", en: "Townhome", cn: "联排别墅", ru: "Таунхаус" },
      VILLA: { th: "วิลล่า", en: "Villa", cn: "独栋别墅", ru: "Вилла" },
      POOL_VILLA: { th: "พูลวิลล่า", en: "Pool Villa", cn: "泳池别墅", ru: "Вилла с бассейном" },
      OFFICE_BUILDING: { th: "อาคารสำนักงาน", en: "Office Building", cn: "写字楼", ru: "Офисное здание" },
      COMMERCIAL_BUILDING: { th: "อาคารพาณิชย์", en: "Commercial Building", cn: "商业建筑", ru: "Коммерческое здание" },
    };
    const key = (propertyType || "").toUpperCase();
    return tMap[key]?.[language] || tMap[key]?.en || "";
  })();

  const unitsCountLabel = (() => {
    if (language === "en") return "Units";
    if (language === "cn") return "套";
    if (language === "ru") return "ед.";
    return "ยูนิต";
  })();

  const sameProjectBadgeFallback = (() => {
    if (language === "en") return "Same Project";
    if (language === "cn") return "同楼盘";
    if (language === "ru") return "Этот проект";
    return "โครงการเดียวกัน";
  })();

  const gradientProjectName = (
    <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent font-extrabold">
      {displayProjectName}
    </span>
  );

  const renderTitle = () => {
    if (!displayProjectName) {
      if (language === "en") return "Other Units in the Same Project";
      if (language === "cn") return "同楼盘其他房源";
      if (language === "ru") return "Другие объекты в этом проекте";
      return "ทรัพย์อื่นที่อยู่ในโครงการเดียวกัน";
    }

    if (language === "en") {
      return <>Other Units in {gradientProjectName}</>;
    }
    if (language === "cn") {
      return <>{gradientProjectName} 同楼盘其他房源</>;
    }
    if (language === "ru") {
      return <>Другие объекты в {gradientProjectName}</>;
    }
    return <>ทรัพย์อื่นที่อยู่ในโครงการ {gradientProjectName}</>;
  };

  const subtitle = (() => {
    if (language === "en") {
      return `Compare floor plans, sizes, and pricing across all available ${propertyTypeLabel.toLowerCase()} units in this development`;
    }
    if (language === "cn") {
      return "对比本楼盘其他户型、建筑面积与租售价格";
    }
    if (language === "ru") {
      return "Сравните планировки, площади и цены среди всех доступных объектов в этом проекте";
    }
    return `เปรียบเทียบขนาด ชั้น และราคาของยูนิต${propertyTypeLabel ? `${propertyTypeLabel}` : ""}อื่นที่มีอยู่ในโครงการนี้`;
  })();

  const viewAllHref = projectSlug
    ? `${langPrefix}/projects/${encodeURIComponent(projectSlug)}`
    : displayProjectName
      ? `${langPrefix}/properties?keyword=${encodeURIComponent(displayProjectName)}`
      : `${langPrefix}/properties`;

  return (
    <section className="py-8 md:py-10 border-t border-slate-100">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6 md:mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{propertyTypeLabel ? `${propertyTypeLabel}: ` : ""}{displayProjectName || sameProjectBadgeFallback}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>{properties.length} {unitsCountLabel}</span>
            </span>
          </div>

          <h2 className="text-lg md:text-xl border-l-4 border-indigo-600 bg-linear-to-r from-indigo-50/80 via-blue-50/40 to-white px-4 py-2.5 rounded-r-xl font-bold text-slate-900 flex items-start gap-2.5">
            <Layers className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              {/* Line 1: ทรัพย์อื่นที่อยู่ในโครงการ + ชื่อโครงการ (สำหรับภาษาอื่นใช้ eng ทั้งหมด) */}
              <span>{renderTitle()}</span>

              {/* Line 2 (เฉพาะภาษาไทยเท่านั้น ที่มี ภาษา eng อยู่อีกบรรทัดด้วย และไม่ซ้ำกับบรรทัดแรก) */}
              {language === "th" && cleanEn && cleanEn.trim() !== (cleanTh || "").trim() && (
                <span className="text-xs sm:text-sm font-semibold text-slate-400 mt-0.5">
                  {cleanEn}
                </span>
              )}
            </div>
          </h2>
          <p className="text-slate-500 text-sm mt-2 pl-4">
            {subtitle}
          </p>
        </div>

        {displayProjectName && (
          <Link
            href={viewAllHref}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group self-start md:self-auto shrink-0 transition-colors"
          >
            <span>
              {language === "en"
                ? "View all units"
                : language === "cn"
                  ? "查看同楼盘所有房源"
                  : language === "ru"
                    ? "Все объекты в проекте"
                    : "ดูทุกห้องในโครงการนี้"}
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {properties.map((property) => (
          <div
            key={property.id}
            className="min-w-0"
            onClick={() => {
              try {
                pushToDataLayer(GTM_EVENTS.CLICK_SIMILAR_PROPERTY, {
                  item_id: property.id,
                  item_name: property.title,
                });
                updateAIScore(20);
              } catch (e) {}
            }}
          >
            <PropertyCard
              property={property}
              compareWith={compareData}
              footerVariant="minimal"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
