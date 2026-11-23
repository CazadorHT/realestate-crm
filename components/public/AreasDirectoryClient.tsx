"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Search, ArrowRight, Building2, X, Sparkles, ArrowUpDown } from "lucide-react";
import { getProvinceName } from "@/lib/utils/provinces";

export interface DirectoryAreaItem {
  id: string;
  name: {
    th: string;
    en: string;
    cn: string;
    ru: string;
  };
  slug: string;
  imageUrl: string | null;
  province: string | null;
  count: number;
}

interface AreasDirectoryClientProps {
  areas: DirectoryAreaItem[];
  language: "th" | "en" | "cn" | "ru";
  langPrefix: string;
}

const LABELS = {
  th: {
    searchPlaceholder: "ค้นหาทำเล เช่น สุขุมวิท, ทองหล่อ, สาทร, ภูเก็ต...",
    allProvinces: "ทุกจังหวัด",
    explore: "สำรวจย่านนี้",
    listingsUnit: "ประกาศ",
    sortPopular: "ทรัพย์มากสุด",
    sortAlpha: "ก–ฮ",
    emptyTitle: "ไม่พบทำเลที่ตรงกับการค้นหา",
    emptyDesc: "ลองเปลี่ยนคำค้นหาหรือเลือกดูทำเลทั้งหมด",
    resetBtn: "แสดงทั้งหมด",
    showing: "แสดง",
    of: "จาก",
    areasUnit: "ทำเล",
  },
  en: {
    searchPlaceholder: "Search neighborhood, e.g. Sukhumvit, Thonglor, Sathorn...",
    allProvinces: "All Locations",
    explore: "Explore",
    listingsUnit: "Listings",
    sortPopular: "Most Listings",
    sortAlpha: "A–Z",
    emptyTitle: "No matching neighborhoods found",
    emptyDesc: "Try a different keyword or browse all locations.",
    resetBtn: "Show All",
    showing: "Showing",
    of: "of",
    areasUnit: "areas",
  },
  cn: {
    searchPlaceholder: "搜索热门区域，例如：素坤逸、通罗、沙吞、普吉...",
    allProvinces: "全部地区",
    explore: "探索区域",
    listingsUnit: "套房源",
    sortPopular: "房源最多",
    sortAlpha: "A–Z",
    emptyTitle: "未找到匹配的区域",
    emptyDesc: "请尝试其他关键词或查看全部区域。",
    resetBtn: "显示全部",
    showing: "显示",
    of: "共",
    areasUnit: "个区域",
  },
  ru: {
    searchPlaceholder: "Поиск района, например: Сукхумвит, Тонглор, Пхукет...",
    allProvinces: "Все регионы",
    explore: "Смотреть",
    listingsUnit: "объектов",
    sortPopular: "По количеству",
    sortAlpha: "А–Я",
    emptyTitle: "Районы не найдены",
    emptyDesc: "Попробуйте другой запрос или выберите все регионы.",
    resetBtn: "Показать все",
    showing: "Показано",
    of: "из",
    areasUnit: "районов",
  },
};

export function AreasDirectoryClient({
  areas,
  language,
  langPrefix,
}: AreasDirectoryClientProps) {
  const [query, setQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"popular" | "alpha">("popular");
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const t = LABELS[language] || LABELS.th;

  // Build province filter pills sorted by total property count (highest inventory first)
  const provinceOptions = useMemo(() => {
    const stats = new Map<string, { areaCount: number; propCount: number }>();
    for (const a of areas) {
      const prov = (a.province || "กรุงเทพมหานคร").trim();
      const cur = stats.get(prov) || { areaCount: 0, propCount: 0 };
      cur.areaCount += 1;
      cur.propCount += a.count || 0;
      stats.set(prov, cur);
    }
    return Array.from(stats.entries())
      .sort((a, b) => b[1].propCount - a[1].propCount || b[1].areaCount - a[1].areaCount)
      .map(([raw, st]) => ({
        raw,
        label: getProvinceName(raw, language) || raw,
        count: st.areaCount,
      }));
  }, [areas, language]);

  // Filter & sort areas (Default: Most Listings -> Alphabetical tie-breaker)
  const filteredAreas = useMemo(() => {
    const q = query.trim().toLowerCase();
    const localeCode = language === "th" ? "th" : language === "cn" ? "zh" : language === "ru" ? "ru" : "en";

    const list = areas.filter((area) => {
      const areaProv = (area.province || "กรุงเทพมหานคร").trim();
      if (selectedProvince !== "ALL" && areaProv !== selectedProvince) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        area.name.th,
        area.name.en,
        area.name.cn,
        area.name.ru,
        area.slug,
        getProvinceName(areaProv, language),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    return [...list].sort((a, b) => {
      const nameA = a.name?.[language] || a.name?.en || a.name?.th || "";
      const nameB = b.name?.[language] || b.name?.en || b.name?.th || "";

      if (sortBy === "alpha") {
        return nameA.localeCompare(nameB, localeCode);
      }
      // Default: Most listings first, then alphabetical tie-breaker
      if (b.count !== a.count) return b.count - a.count;
      return nameA.localeCompare(nameB, localeCode);
    });
  }, [areas, query, selectedProvince, sortBy, language]);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
      {/* Floating Luxury Search & Province Filter Bar */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-4 sm:p-5 mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full h-11 pl-11 pr-10 rounded-2xl bg-slate-50 border border-slate-200/90 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Province Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none flex-1">
            <button
              type="button"
              onClick={() => setSelectedProvince("ALL")}
              className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                selectedProvince === "ALL"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {t.allProvinces} ({areas.length})
            </button>
            {provinceOptions.map((prov) => (
              <button
                key={prov.raw}
                type="button"
                onClick={() => setSelectedProvince(prov.raw)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  selectedProvince === prov.raw
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                    : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                {prov.label} ({prov.count})
              </button>
            ))}
          </div>

          {/* Segmented Sort Toggle: Most Listings vs A-Z / ก-ฮ */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-full shrink-0 self-start lg:self-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1 hidden sm:block" />
            <button
              type="button"
              onClick={() => setSortBy("popular")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                sortBy === "popular"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.sortPopular}
            </button>
            <button
              type="button"
              onClick={() => setSortBy("alpha")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                sortBy === "alpha"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.sortAlpha}
            </button>
          </div>
        </div>

        {/* Live Result Counter */}
        {(query || selectedProvince !== "ALL") && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              {t.showing} <strong className="text-slate-800">{filteredAreas.length}</strong> {t.of}{" "}
              {areas.length} {t.areasUnit}
            </span>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedProvince("ALL");
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              {t.resetBtn}
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredAreas.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 py-16 px-6 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">{t.emptyTitle}</h3>
          <p className="text-sm text-slate-500 mb-6">{t.emptyDesc}</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSelectedProvince("ALL");
            }}
            className="px-6 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
          >
            {t.resetBtn}
          </button>
        </div>
      ) : (
        /* Luxury Editorial Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAreas.map((area) => {
            const primaryName =
              area.name?.[language] || area.name?.en || area.name?.th || "";
            // Show English sub-label on Thai mode only (keeps EN/CN/RU clean without Thai leakage)
            const subLabel =
              language === "th" && area.name?.en && area.name.en !== primaryName
                ? area.name.en
                : null;
            const provinceName = getProvinceName(
              area.province || "กรุงเทพมหานคร",
              language,
            );
            const isCanonicalSlug = Boolean(area.slug && /^[a-z0-9-]+$/i.test(area.slug));
            const href = isCanonicalSlug
              ? `${langPrefix}/areas/${area.slug}`
              : `${langPrefix}/properties?q=${encodeURIComponent(area.name.th || primaryName)}`;
            const imgSrc =
              !failedImages[area.id] && area.imageUrl
                ? area.imageUrl
                : "/images/area-placeholder1.jpg";

            return (
              <Link
                key={area.id || area.slug}
                href={href}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-2xl hover:shadow-blue-950/10 hover:border-blue-200 transition-all duration-300 hover:-translate-y-1.5 flex flex-col"
              >
                {/* Cover Photo */}
                <div className="relative aspect-[16/11] w-full bg-slate-100 overflow-hidden">
                  {imgSrc ? (
                    <Image
                      src={imgSrc}
                      alt={primaryName}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-107 transition-transform duration-700 ease-out"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [area.id]: true }))
                      }
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                      <Building2 className="w-9 h-9 mb-1 opacity-50" />
                    </div>
                  )}

                  {/* Refined Bottom Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                  {/* Province Pill */}
                  {provinceName && (
                    <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-white/92 text-slate-800 text-[11px] font-bold shadow-sm flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-blue-600" />
                      <span>{provinceName}</span>
                    </div>
                  )}

                  {/* Area Name Overlay */}
                  <div className="absolute bottom-3.5 left-4 right-4 text-white">
                    <h2 className="text-lg sm:text-xl font-bold leading-snug tracking-tight drop-shadow-sm group-hover:text-blue-200 transition-colors line-clamp-2">
                      {primaryName}
                    </h2>
                    {subLabel && (
                      <p className="text-xs text-slate-200/90 font-medium truncate mt-0.5">
                        {subLabel}
                      </p>
                    )}
                  </div>
                </div>

                {/* Clean White Editorial Footer with Property Count */}
                <div className="px-4 py-3.5 bg-white flex items-center justify-between gap-2 text-xs font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100/80">
                    <Sparkles className="w-3 h-3 text-blue-500" />
                    <span>
                      {area.count.toLocaleString()} {t.listingsUnit}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-slate-600 group-hover:text-blue-600 transition-colors">
                    <span>{t.explore}</span>
                    <span className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all duration-300">
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
