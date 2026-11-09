"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MdMapsHomeWork } from "react-icons/md";
import { PropertyCard, PropertyCardProps } from "./PropertyCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { PropertyType } from "@/features/properties/types";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { updateAIScore } from "@/lib/analytics-utils";
import { parseBilingualProjectName } from "@/lib/utils/project-name-utils";

interface SimilarPropertiesClientProps {
  properties: PropertyCardProps[];
  propertyType: PropertyType;
  compareData?: {
    price: number | null;
    size: number | null;
    date: string | null;
  };
  projectName?: string | null;
  projectNameEn?: string | null;
  popularArea?: string | null;
  popularAreaEn?: string | null;
  popularAreaCn?: string | null;
  popularAreaRu?: string | null;
  province?: string | null;
  hasSameProjectUnits?: boolean;
}

export function SimilarPropertiesClient({
  properties,
  propertyType,
  compareData,
  projectName,
  projectNameEn,
  popularArea,
  popularAreaEn,
  popularAreaCn,
  popularAreaRu,
  province,
  hasSameProjectUnits,
}: SimilarPropertiesClientProps) {
  const { t, langPrefix, language } = useLanguage();

  // จัดการชื่อโครงการ: หากนอกเหนือจาก th ให้ใช้ eng กับภาษาอื่นทั้งหมด
  const { cleanTh: projTh, cleanEn: projEn } = parseBilingualProjectName(projectName, projectNameEn);
  const displayProjectName = language === "th" ? (projTh || projEn) : (projEn || projTh);

  // จัดการชื่อทำเลตามภาษา
  const displayArea = (() => {
    if (language === "th") return popularArea;
    if (language === "cn") return popularAreaCn || popularAreaEn || popularArea;
    if (language === "ru") return popularAreaRu || popularAreaEn || popularArea;
    return popularAreaEn || popularArea;
  })();

  // Dynamic titles based on context
  const getSectionTitle = () => {
    if (hasSameProjectUnits) {
      if (language === "en") return "Same Project & Nearby Properties";
      if (language === "cn") return "同楼盘及周边精选房源";
      if (language === "ru") return "В этом ЖК и соседних проектах";
      return "โครงการเดียวกัน & โครงการใกล้เคียง";
    }
    if (displayArea) {
      const gradientArea = (
        <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent font-extrabold">
          {displayArea}
        </span>
      );
      if (language === "en") return <>Similar Properties in {gradientArea}</>;
      if (language === "cn") return <>{gradientArea} 类似房源</>;
      if (language === "ru") return <>Похожие объекты в {gradientArea}</>;
      return <>โครงการและทรัพย์ที่คล้ายกันในย่าน {gradientArea}</>;
    }
    return t("similar_properties.title");
  };

  const getSectionSubtitle = () => {
    if (hasSameProjectUnits) {
      if (language === "en") {
        return `Compare other units in ${displayProjectName ? `"${displayProjectName}"` : "this project"} and notable properties around ${displayArea || province || "this area"}`;
      }
      if (language === "cn") {
        return `对比 ${displayProjectName ? `"${displayProjectName}"` : "本楼盘"} 其他房源及周边 ${displayArea || ""} 优质好房`;
      }
      if (language === "ru") {
        return `Сравните другие варианты в ${displayProjectName ? `"${displayProjectName}"` : "этом проекте"} и рядом в районе ${displayArea || ""}`;
      }
      return `เปรียบเทียบยูนิตอื่นในโครงการ ${displayProjectName ? `"${displayProjectName}"` : ""} และโครงการเด่นรอบทำเล ${displayArea || province || ""}`;
    }
    if (displayArea) {
      if (language === "en") return `Similar properties in ${displayArea} and surrounding neighborhoods`;
      if (language === "cn") return `位于 ${displayArea} 及其周边的同类型房源`;
      if (language === "ru") return `Похожие объекты в районе ${displayArea} и поблизости`;
      return `อสังหาริมทรัพย์ประเภทเดียวกันในทำเล ${displayArea} และละแวกใกล้เคียง`;
    }
    return t("similar_properties.subtitle");
  };

  const viewAllHref = popularArea
    ? `${langPrefix}/properties?type=${propertyType}&area=${encodeURIComponent(popularArea)}`
    : `${langPrefix}/properties?type=${propertyType}`;

  return (
    <section className="py-8 md:py-12 border-t border-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-lg md:text-xl border-l-4 border-blue-600 bg-linear-to-r from-blue-50 to-white px-4 py-2.5 rounded-r-xl font-bold text-slate-900 flex items-center gap-2">
            <MdMapsHomeWork className="w-5 h-5 text-blue-600" />{" "}
            {getSectionTitle()}
          </h2>
          <p className="text-slate-500 text-sm mt-2 pl-4">
            {getSectionSubtitle()}
          </p>
        </div>

        <Link
          href={viewAllHref}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 group self-start md:self-auto shrink-0"
        >
          {t("similar_properties.view_all")}{" "}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Property Cards Grid */}
      {properties.length > 0 ? (
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
                  updateAIScore(15);
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
      ) : (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 text-sm">
          {language === "en"
            ? "No similar properties found in this exact area right now."
            : `ยังไม่มียูนิตที่คล้ายกันในทำเลนี้ในขณะนี้`}
        </div>
      )}
    </section>
  );
}
