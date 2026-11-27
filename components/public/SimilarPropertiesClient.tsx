"use client";

import Link from "next/link";
import { ArrowRight, Compass, MapPin } from "lucide-react";
import { MdMapsHomeWork } from "react-icons/md";
import { PropertyCard, PropertyCardProps } from "./PropertyCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { PropertyType } from "@/features/properties/types";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { updateAIScore } from "@/lib/analytics-utils";
import { parseBilingualProjectName } from "@/lib/utils/project-name-utils";
import { getProvinceName } from "@/lib/utils/provinces";

export type SimilarPropertyItem = PropertyCardProps & {
  matchTier?: "same_area" | "nearby_area" | "province";
};

interface SimilarPropertiesClientProps {
  properties: SimilarPropertyItem[];
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
  sameAreaMatchCount?: number;
  sameAreaHasMore?: boolean;
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
  sameAreaMatchCount = 0,
  sameAreaHasMore = false,
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

  const displayProvince = province
    ? getProvinceName(province, language === "th" ? "th" : "en")
    : "";

  // Group cards by geographic match tier so users clearly see which listings are
  // in the exact same neighborhood vs adjacent neighborhoods vs other zones in the same province.
  const sameAreaProps = properties.filter((p) => !p.matchTier || p.matchTier === "same_area");
  const nearbyAreaProps = properties.filter((p) => p.matchTier === "nearby_area");
  const otherZoneProps = properties.filter((p) => p.matchTier === "province");
  const hasTierGroups = nearbyAreaProps.length > 0 || otherZoneProps.length > 0;

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
      if (sameAreaProps.length === 0 && nearbyAreaProps.length > 0) {
        if (language === "en") return <>Similar Properties Near {gradientArea}</>;
        if (language === "cn") return <>{gradientArea} 周边类似房源</>;
        if (language === "ru") return <>Похожие объекты рядом с {gradientArea}</>;
        return <>โครงการและทรัพย์ที่คล้ายกันใกล้ย่าน {gradientArea}</>;
      }
      if (sameAreaProps.length === 0 && nearbyAreaProps.length === 0 && displayProvince) {
        const gradientProv = (
          <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent font-extrabold">
            {displayProvince}
          </span>
        );
        if (language === "en") return <>Similar Properties in {gradientProv}</>;
        if (language === "cn") return <>{gradientProv} 类似房源推荐</>;
        if (language === "ru") return <>Похожие объекты в {gradientProv}</>;
        return <>โครงการและทรัพย์ประเภทเดียวกันใน {gradientProv}</>;
      }
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

  const viewAllHref =
    popularArea && sameAreaProps.length > 0
      ? `${langPrefix}/properties?type=${propertyType}&area=${encodeURIComponent(popularArea)}`
      : `${langPrefix}/properties?type=${propertyType}`;

  return (
    <section className="py-8 md:py-12 border-t border-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3.5 sm:gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-lg md:text-xl border-l-4 border-blue-600 bg-linear-to-r from-blue-50 to-white px-4 py-2.5 rounded-r-xl font-bold text-slate-900 flex items-center gap-2">
            <MdMapsHomeWork className="w-5 h-5 text-blue-600 shrink-0" />{" "}
            <span>{getSectionTitle()}</span>
          </h2>
          <p className="text-slate-500 text-sm mt-2 pl-4">
            {getSectionSubtitle()}
          </p>
        </div>

        <Link
          prefetch={false}
          href={viewAllHref}
          className="inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-blue-600 hover:text-white bg-blue-50/80 hover:bg-blue-600 border border-blue-200/80 hover:border-blue-600 shadow-2xs hover:shadow-md transition-all duration-200 active:scale-95 group shrink-0 self-end sm:self-auto"
        >
          <span>
            {t("similar_properties.view_all")}
            {sameAreaMatchCount > properties.length && (
              <span className="ml-1 font-bold">
                ({sameAreaHasMore ? `${sameAreaMatchCount}+` : sameAreaMatchCount})
              </span>
            )}
          </span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Property Cards Grid — 1 single 4-col row with unified group wrappers by matchTier */}
      {properties.length > 0 ? (
        !hasTierGroups ? (
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
          (() => {
            const COL_SPAN: Record<number, string> = {
              1: "lg:col-span-1",
              2: "lg:col-span-2",
              3: "lg:col-span-3",
              4: "lg:col-span-4",
            };
            const INNER_GRID: Record<number, string> = {
              1: "grid-cols-1",
              2: "grid-cols-1 sm:grid-cols-2",
              3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
              4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
            };

            const otherZoneAreaNames = Array.from(
              new Set(
                otherZoneProps
                  .map((p) => {
                    if (language === "th") return p.popular_area;
                    if (language === "cn") return p.popular_area_cn || p.popular_area_en || p.popular_area;
                    if (language === "ru") return p.popular_area_ru || p.popular_area_en || p.popular_area;
                    return p.popular_area_en || p.popular_area;
                  })
                  .map((s) => s?.trim())
                  .filter(Boolean) as string[],
              ),
            ).slice(0, 2);
            const otherZoneAreaText = otherZoneAreaNames.join(", ");

            const tierGroups = [
              {
                key: "same_area",
                items: sameAreaProps,
                container: "bg-emerald-50/40 border border-emerald-100/90",
                pill: "bg-emerald-600 text-white",
                icon: <MapPin className="w-3 h-3 shrink-0" />,
                label:
                  language === "en"
                    ? `In ${displayArea || "Same Area"}`
                    : language === "cn"
                      ? `位于 ${displayArea || "同区域"}`
                      : language === "ru"
                        ? `Район ${displayArea || ""}`
                        : `ในย่าน ${displayArea || "เดียวกัน"}`,
              },
              {
                key: "nearby_area",
                items: nearbyAreaProps,
                container: "bg-blue-50/50 border border-blue-100/90",
                pill: "bg-blue-600 text-white",
                icon: <MapPin className="w-3 h-3 shrink-0" />,
                label:
                  language === "en"
                    ? `Nearby ${displayArea || "Area"}`
                    : language === "cn"
                      ? `${displayArea || ""} 周边相邻区域`
                      : language === "ru"
                        ? `Рядом с ${displayArea || ""}`
                        : `ทำเลติดกันใกล้ ${displayArea || "ย่านนี้"}`,
              },
              {
                key: "province",
                items: otherZoneProps,
                container: "bg-slate-100/80 border border-slate-200/90",
                pill: "bg-slate-700 text-white",
                icon: <Compass className="w-3 h-3 shrink-0" />,
                label:
                  language === "en"
                    ? `Other area · ${otherZoneAreaText || displayProvince || "Same province"}`
                    : language === "cn"
                      ? `其他区域 · ${otherZoneAreaText || displayProvince || "同省"}`
                      : language === "ru"
                        ? `Другой район · ${otherZoneAreaText || displayProvince || ""}`
                        : otherZoneAreaText
                          ? `โซนอื่น · ${otherZoneAreaText}`
                          : `โซนอื่นใน${displayProvince || "จังหวัดเดียวกัน"}`,
              },
            ].filter((g) => g.items.length > 0);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
                {tierGroups.map((group) => {
                  const n = Math.min(group.items.length, 4);
                  return (
                    <div
                      key={group.key}
                      className={`min-w-0 flex flex-col rounded-2xl p-3 md:p-3.5 ${group.container} ${COL_SPAN[n] || "lg:col-span-4"}`}
                    >
                      <div className="mb-3 flex items-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-2xs truncate ${group.pill}`}
                        >
                          {group.icon}
                          <span className="truncate">{group.label}</span>
                        </span>
                      </div>
                      <div className={`grid ${INNER_GRID[n] || "grid-cols-1"} gap-4 flex-1`}>
                        {group.items.map((property) => (
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
                    </div>
                  );
                })}
              </div>
            );
          })()
        )
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
