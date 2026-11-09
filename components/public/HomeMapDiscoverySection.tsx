"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowUpRight, 
  Compass, 
  Layers, 
  Building2, 
  Home, 
  Warehouse, 
  Briefcase, 
  Store, 
  Trees, 
  ChevronDown, 
  Check,
  MapPin,
  Search
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useMapPins } from "@/hooks/search/useMapPins";
import { PropertyVectorMapLazy } from "@/components/public/map/PropertyVectorMapLazy";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { cn } from "@/lib/utils";

interface HomeMapDiscoverySectionProps {
  language?: string;
}

type PropertyTypeFilter = "ALL" | "CONDO" | "HOUSE" | "TOWNHOME" | "OFFICE" | "COMMERCIAL" | "LAND";

interface PropertyTypeItem {
  id: PropertyTypeFilter;
  label: { th: string; en: string; cn: string; ru: string };
  icon: React.ComponentType<{ className?: string }>;
  countKey: keyof {
    ALL: number;
    CONDO: number;
    HOUSE: number;
    TOWNHOME: number;
    OFFICE: number;
    COMMERCIAL: number;
    LAND: number;
  };
}

const PROPERTY_TYPE_ITEMS: PropertyTypeItem[] = [
  {
    id: "ALL",
    label: { th: "ทุกประเภททรัพย์", en: "All Property Types", cn: "全部物业类型", ru: "Все типы" },
    icon: Layers,
    countKey: "ALL",
  },
  {
    id: "CONDO",
    label: { th: "คอนโดมิเนียม", en: "Condominiums", cn: "公寓住宅", ru: "Кондоминиумы" },
    icon: Building2,
    countKey: "CONDO",
  },
  {
    id: "HOUSE",
    label: { th: "บ้านเดี่ยว / วิลล่า", en: "Houses & Villas", cn: "独栋别墅", ru: "Дома и Виллы" },
    icon: Home,
    countKey: "HOUSE",
  },
  {
    id: "TOWNHOME",
    label: { th: "ทาวน์โฮม", en: "Townhomes", cn: "联排别墅", ru: "Таунхаусы" },
    icon: Warehouse,
    countKey: "TOWNHOME",
  },
  {
    id: "OFFICE",
    label: { th: "สำนักงาน / ออฟฟิศ", en: "Office Spaces", cn: "写字楼办公", ru: "Офисы" },
    icon: Briefcase,
    countKey: "OFFICE",
  },
  {
    id: "COMMERCIAL",
    label: { th: "อาคารพาณิชย์", en: "Commercial", cn: "商用物业", ru: "Коммерческая" },
    icon: Store,
    countKey: "COMMERCIAL",
  },
  {
    id: "LAND",
    label: { th: "ที่ดิน", en: "Land", cn: "土地地皮", ru: "Земля" },
    icon: Trees,
    countKey: "LAND",
  },
];

function matchesPropertyType(pinPropertyType: string | undefined | null, selectedType: PropertyTypeFilter): boolean {
  if (selectedType === "ALL") return true;
  const pt = pinPropertyType?.toUpperCase() || "";
  if (selectedType === "CONDO") return pt === "CONDO";
  if (selectedType === "HOUSE") return ["HOUSE", "VILLA", "POOL_VILLA"].includes(pt);
  if (selectedType === "TOWNHOME") return pt === "TOWNHOME";
  if (selectedType === "OFFICE") return ["OFFICE", "OFFICE_BUILDING", "HOME_OFFICE"].includes(pt);
  if (selectedType === "COMMERCIAL") return ["COMMERCIAL", "COMMERCIAL_BUILDING"].includes(pt);
  if (selectedType === "LAND") return pt === "LAND";
  return true;
}

export function HomeMapDiscoverySection({ language: propLang }: HomeMapDiscoverySectionProps) {
  const { language: ctxLang, langPrefix } = useLanguage();
  const language = ctxLang || propLang || "th";

  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  // Filter states
  const [selectedType, setSelectedType] = useState<PropertyTypeFilter>("ALL");
  const [selectedArea, setSelectedArea] = useState<string>("ALL");
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [isAreaDialogOpen, setIsAreaDialogOpen] = useState(false);
  const [areaSearchQuery, setAreaSearchQuery] = useState("");

  // Lazy-mount map script only when section scrolls within 300px of viewport
  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const { pins, stations, isLoading } = useMapPins(isInView);

  // 1. Calculate dynamic counts for all property types (overall inventory)
  const typeCounts = useMemo(() => {
    const counts = {
      ALL: pins.length,
      CONDO: 0,
      HOUSE: 0,
      TOWNHOME: 0,
      OFFICE: 0,
      COMMERCIAL: 0,
      LAND: 0,
    };

    pins.forEach((pin) => {
      const pt = pin.property_type?.toUpperCase() || "";
      if (pt === "CONDO") counts.CONDO += 1;
      else if (["HOUSE", "VILLA", "POOL_VILLA"].includes(pt)) counts.HOUSE += 1;
      else if (pt === "TOWNHOME") counts.TOWNHOME += 1;
      else if (["OFFICE", "OFFICE_BUILDING", "HOME_OFFICE"].includes(pt)) counts.OFFICE += 1;
      else if (["COMMERCIAL", "COMMERCIAL_BUILDING"].includes(pt)) counts.COMMERCIAL += 1;
      else if (pt === "LAND") counts.LAND += 1;
    });

    return counts;
  }, [pins]);

  // Available Property Types: Only show types with > 0 listings, sorted by count descending
  const availableTypeItems = useMemo(() => {
    const allItem = PROPERTY_TYPE_ITEMS.find((item) => item.id === "ALL")!;
    const otherItems = PROPERTY_TYPE_ITEMS.filter(
      (item) => item.id !== "ALL" && (typeCounts[item.countKey] || 0) > 0
    ).sort((a, b) => (typeCounts[b.countKey] || 0) - (typeCounts[a.countKey] || 0));

    return [allItem, ...otherItems];
  }, [typeCounts]);

  // If active selectedType has 0 units, reset to "ALL"
  useEffect(() => {
    if (selectedType !== "ALL") {
      const activeItem = PROPERTY_TYPE_ITEMS.find((item) => item.id === selectedType);
      if (activeItem && (typeCounts[activeItem.countKey] || 0) === 0) {
        setSelectedType("ALL");
      }
    }
  }, [selectedType, typeCounts]);

  // 2. Context-Aware Dynamic Popular Areas:
  // Dynamically counts and ranks locations based on the currently selected property type
  const allAreas = useMemo(() => {
    const areaCounts: Record<
      string,
      { id: string; th: string; en: string; cn: string; ru: string; count: number }
    > = {};

    pins.forEach((pin) => {
      if (!matchesPropertyType(pin.property_type, selectedType)) return;

      const areaTh = pin.popular_area?.trim();
      if (!areaTh) return;

      if (!areaCounts[areaTh]) {
        areaCounts[areaTh] = {
          id: areaTh,
          th: areaTh,
          en: pin.popular_area_en?.trim() || areaTh,
          cn: pin.popular_area_cn?.trim() || areaTh,
          ru: pin.popular_area_ru?.trim() || areaTh,
          count: 0,
        };
      }
      areaCounts[areaTh].count += 1;
    });

    // Sort by count descending (only locations with > 0 listings)
    return Object.values(areaCounts).sort((a, b) => b.count - a.count);
  }, [pins, selectedType]);

  // If the currently selected area has 0 units for the newly switched type, reset to "ALL"
  useEffect(() => {
    if (selectedArea !== "ALL") {
      const areaStillExists = allAreas.some((a) => a.id === selectedArea);
      if (!areaStillExists) {
        setSelectedArea("ALL");
      }
    }
  }, [allAreas, selectedArea]);

  // Display Top 8 pills + guarantee the active selected area is always visible in the pill row
  const displayedAreas = useMemo(() => {
    const top = allAreas.slice(0, 8);
    if (selectedArea !== "ALL") {
      const isSelectedInTop = top.some((a) => a.id === selectedArea);
      if (!isSelectedInTop) {
        const found = allAreas.find((a) => a.id === selectedArea);
        if (found) {
          return [...top, found];
        }
      }
    }
    return top;
  }, [allAreas, selectedArea]);

  // Areas filtered by search query in the full dialog
  const dialogFilteredAreas = useMemo(() => {
    if (!areaSearchQuery.trim()) return allAreas;
    const q = areaSearchQuery.toLowerCase().trim();
    return allAreas.filter(
      (a) =>
        a.th.toLowerCase().includes(q) ||
        a.en.toLowerCase().includes(q) ||
        a.cn.toLowerCase().includes(q) ||
        a.ru.toLowerCase().includes(q)
    );
  }, [allAreas, areaSearchQuery]);

  // 3. Filtered pins based on active filters
  const filteredPins = useMemo(() => {
    return pins.filter((pin) => {
      // Type filtering
      if (!matchesPropertyType(pin.property_type, selectedType)) return false;

      // Area filtering
      if (selectedArea !== "ALL") {
        const areaString = (
          (pin.popular_area || "") +
          " " +
          (pin.popular_area_en || "") +
          " " +
          (pin.location || "")
        ).toLowerCase();
        if (!areaString.includes(selectedArea.toLowerCase())) return false;
      }

      return true;
    });
  }, [pins, selectedType, selectedArea]);

  // Signature triggers map fitBounds only when an explicit area is selected
  const locationFilterSignature = useMemo(() => {
    if (selectedArea === "ALL" && selectedType === "ALL") return "";
    return `${selectedArea}_${selectedType}`;
  }, [selectedArea, selectedType]);

  // Active Type object
  const currentTypeObj = useMemo(() => {
    return PROPERTY_TYPE_ITEMS.find((item) => item.id === selectedType) || PROPERTY_TYPE_ITEMS[0];
  }, [selectedType]);

  const CurrentTypeIcon = currentTypeObj.icon;
  const currentTypeLabel = currentTypeObj.label[language as keyof typeof currentTypeObj.label] || currentTypeObj.label.th;
  const currentTypeCount = typeCounts[currentTypeObj.countKey] || 0;

  // Localized section headers
  const badgeText = useMemo(() => {
    if (language === "cn") return "互动价格地图";
    if (language === "ru") return "Интерактивная карта";
    if (language === "en") return "Interactive Live Map";
    return "แผนที่ราคา & พิกัดรถไฟฟ้า";
  }, [language]);

  const titleParts = useMemo(() => {
    if (language === "cn") {
      return {
        prefix: "按 ",
        highlight: "真实地段与 BTS / MRT 轨道交通找房",
      };
    }
    if (language === "ru") {
      return {
        prefix: "Поиск недвижимости ",
        highlight: "по карте и линиям метро BTS / MRT",
      };
    }
    if (language === "en") {
      return {
        prefix: "Explore Properties ",
        highlight: "by Live Map & Transit Lines",
      };
    }
    return {
      prefix: "ค้นหาอสังหาฯ ",
      highlight: "ตามพิกัดจริง & แนวรถไฟฟ้า BTS / MRT",
    };
  }, [language]);

  const subtitleText = useMemo(() => {
    if (language === "cn") return "直接在地图上查看精选房源真实售价与租金，轻松比对地铁站点距离与周边设施";
    if (language === "ru") return "Смотрите актуальные цены продажи и аренды прямо на карте с привязкой к станциям метро";
    if (language === "en") return "Inspect verified sale & rental prices directly on the map, with instant walking distance to BTS/MRT stations";
    return "สำรวจราคาขาย-เช่าจริงทุกยูนิตบนแผนที่แบบ Real-time พร้อมดูระยะห่างจากสถานีรถไฟฟ้าและสิ่งอำนวยความสะดวก";
  }, [language]);

  const fullMapButtonText = useMemo(() => {
    if (language === "cn") return "打开全景地图";
    if (language === "ru") return "Открыть карту на весь экран";
    if (language === "en") return "Open Fullscreen Map";
    return "เปิดแผนที่แบบเต็มหน้าจอ";
  }, [language]);

  return (
    <section
      ref={containerRef}
      className="py-12 md:py-16 px-4 md:px-6 lg:px-8 max-w-screen-2xl mx-auto w-full relative z-10"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
        <div className="space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-blue-700 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200/60 shadow-2xs">
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span>{badgeText}</span>
          </div>
          <h2 className="text-3xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            <span>{titleParts.prefix}</span>
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-blue-500 to-purple-600">
              {titleParts.highlight}
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-500 max-w-2xl leading-relaxed">
            {subtitleText}
          </p>
        </div>

        {/* Header Action CTA Button */}
        <div className="w-full md:w-auto shrink-0">
          <Link
            href={`${langPrefix}/map`}
            prefetch={false}
            className="w-full h-12 md:w-auto inline-flex items-center justify-center gap-2 px-8 py-2.5 rounded-2xl  bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold sm:text-sm shadow-md shadow-blue-600/20 transition-all duration-200"
          >
            <span>{fullMapButtonText}</span>
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* 1. Property Type Trigger with ResponsiveDialog */}
        <ResponsiveDialog
          open={isTypeDialogOpen}
          onOpenChange={setIsTypeDialogOpen}
          title={
            language === "th"
              ? "เลือกประเภทอสังหาริมทรัพย์"
              : language === "cn"
                ? "选择物业类型"
                : language === "ru"
                  ? "Выберите тип недвижимости"
                  : "Select Property Type"
          }
          description={
            language === "th"
              ? "เลือกประเภทที่ต้องการแสดงหมุดราคาบนแผนที่"
              : language === "cn"
                ? "选择要在地图上显示价格图钉的物业类型"
                : language === "ru"
                  ? "Выберите тип недвижимости для отображения цен на карте"
                  : "Filter properties displayed on map"
          }
          trigger={
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
            >
              <CurrentTypeIcon className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{currentTypeLabel}</span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                {currentTypeCount}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-1 pt-2">
            {availableTypeItems.map((item) => {
              const isSelected = selectedType === item.id;
              const count = typeCounts[item.countKey] || 0;
              const Icon = item.icon;
              const label = item.label[language as keyof typeof item.label] || item.label.th;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedType(item.id);
                    setIsTypeDialogOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer",
                    isSelected
                      ? "bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-2xs ring-2 ring-blue-500/20"
                      : "bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                        isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm truncate">{label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-bold",
                        isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {count}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        </ResponsiveDialog>

        {/* 2. Context-Aware Dynamic Popular Areas Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 max-w-full">
          {/* All Areas Pill (shows count for currently selected type) */}
          <button
            type="button"
            onClick={() => setSelectedArea("ALL")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer border flex items-center gap-1.5",
              selectedArea === "ALL"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs font-semibold"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            <span>
              {language === "th" ? "ทุกทำเล" : language === "en" ? "All Areas" : language === "cn" ? "全部区域" : "Все районы"}
            </span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                selectedArea === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              )}
            >
              {currentTypeCount}
            </span>
          </button>

          {/* Top Areas (dynamically ranked by listings for this property type) */}
          {displayedAreas.map((area) => {
            const isSelected = selectedArea === area.id;
            const label = area[language as keyof typeof area] || area.th;

            return (
              <button
                key={area.id}
                type="button"
                onClick={() => setSelectedArea(area.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer border flex items-center gap-1.5",
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs font-semibold"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <span>{label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {area.count}
                </span>
              </button>
            );
          })}

          {/* "+ ดูทำเลทั้งหมด" Button (Opens full area selector dialog if more than 8 areas exist) */}
          {allAreas.length > 8 && (
            <ResponsiveDialog
              open={isAreaDialogOpen}
              onOpenChange={(open) => {
                setIsAreaDialogOpen(open);
                if (!open) setAreaSearchQuery("");
              }}
              title={
                language === "th"
                  ? "เลือกทำเล / ย่านยอดนิยม"
                  : language === "cn"
                    ? "选择热门地段 / 商圈"
                    : language === "ru"
                      ? "Выберите популярный район"
                      : "Select Location"
              }
              description={
                language === "th"
                  ? selectedType === "ALL"
                    ? `เลือกทำเลที่ต้องการสำรวจบนแผนที่ (ทั้งหมด ${allAreas.length} ทำเล)`
                    : `ทำเลที่มี${currentTypeLabel}บนแผนที่ (ทั้งหมด ${allAreas.length} ทำเล)`
                  : language === "cn"
                    ? `在地图上探索 ${currentTypeLabel} 的热门地段（共 ${allAreas.length} 个）`
                    : language === "ru"
                      ? `Исследуйте районы с объектами (${currentTypeLabel}) на карте (всего ${allAreas.length})`
                      : `Explore locations with ${currentTypeLabel} on the map (${allAreas.length} locations)`
              }
              trigger={
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer border flex items-center gap-1.5 bg-blue-50/80 hover:bg-blue-100 text-blue-700 border-blue-200 shadow-2xs hover:border-blue-300 shrink-0"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {language === "th" ? "+ ดูทำเลทั้งหมด" : language === "en" ? "+ All Areas" : language === "cn" ? "+ 全部地段" : "+ Все районы"}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-blue-600 text-white">
                    {allAreas.length}
                  </span>
                </button>
              }
            >
              <div className="space-y-3 pt-2">
                {/* Search Bar within Dialog */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={areaSearchQuery}
                    onChange={(e) => setAreaSearchQuery(e.target.value)}
                    placeholder={
                      language === "th"
                        ? "ค้นหาทำเล เช่น สุขุมวิท, บางนา, อารีย์..."
                        : "Search location..."
                    }
                    className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* All Areas Option inside dialog */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedArea("ALL");
                    setIsAreaDialogOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer",
                    selectedArea === "ALL"
                      ? "bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-2xs ring-2 ring-blue-500/20"
                      : "bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                        selectedArea === "ALL" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm">
                      {language === "th"
                        ? "ทุกทำเล (แสดงทั้งหมดบนแผนที่)"
                        : language === "cn"
                          ? "所有地段 (在地图上显示全部)"
                          : language === "ru"
                            ? "Все районы (Показать все на карте)"
                            : "All Locations (Show all)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-bold",
                        selectedArea === "ALL" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {currentTypeCount}
                    </span>
                    {selectedArea === "ALL" && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                </button>

                {/* Grid of Locations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                  {dialogFilteredAreas.length > 0 ? (
                    dialogFilteredAreas.map((area) => {
                      const isSelected = selectedArea === area.id;
                      const label = area[language as keyof typeof area] || area.th;

                      return (
                        <button
                          key={area.id}
                          type="button"
                          onClick={() => {
                            setSelectedArea(area.id);
                            setIsAreaDialogOpen(false);
                          }}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer",
                            isSelected
                              ? "bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-2xs ring-2 ring-blue-500/20"
                              : "bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                              )}
                            >
                              <MapPin className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs sm:text-sm truncate">{label}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-bold",
                                isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                              )}
                            >
                              {area.count}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-8 text-center text-xs text-slate-400">
                      {language === "th"
                        ? "ไม่พบทำเลที่ตรงกับคำค้นหา"
                        : language === "cn"
                          ? "未找到匹配的地段"
                          : language === "ru"
                            ? "Районы не найдены"
                            : "No locations found"}
                    </div>
                  )}
                </div>
              </div>
            </ResponsiveDialog>
          )}
        </div>
      </div>

      {/* Map Card Canvas (Clean: Zero custom floating elements overlapping with native map controls) */}
      <div className="h-[460px] sm:h-[500px] md:h-[560px] w-full bg-slate-100 rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden relative">
        {isInView ? (
          <PropertyVectorMapLazy
            filteredPins={filteredPins}
            stations={stations}
            isLoading={isLoading}
            activeListingFilter="ALL"
            locationFilterSignature={locationFilterSignature}
            className="w-full h-full rounded-3xl"
            suppressMobilePopup={false}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-50 text-slate-400">
            <Compass className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-xs font-semibold text-slate-500">
              {language === "th"
                ? "กำลังเตรียมแผนที่..."
                : language === "cn"
                  ? "正在加载地图..."
                  : language === "ru"
                    ? "Загрузка карты..."
                    : "Loading Map..."}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
