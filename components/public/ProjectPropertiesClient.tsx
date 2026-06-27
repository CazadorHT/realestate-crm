"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronDown, Grid3X3, SlidersHorizontal, MapPin, Building } from "lucide-react";
import { PropertyCard } from "@/components/public/PropertyCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { PublicPropertyNearStation } from "@/features/public/stations";
import type { PublicProject } from "@/features/public/projects";

interface ProjectPropertiesClientProps {
  initialProperties: PublicPropertyNearStation[];
  project: PublicProject;
}

type FilterType = "ALL" | "SALE" | "RENT";
type SortType = "newest" | "price-asc" | "price-desc" | "size-asc" | "size-desc";

const TRANSLATIONS: Record<string, Record<string, string>> = {
  tab_all: { th: "ทั้งหมด", en: "All", cn: "全部", ru: "Все" },
  tab_sale: { th: "สำหรับขาย", en: "For Sale", cn: "出售", ru: "Продажа" },
  tab_rent: { th: "สำหรับเช่า", en: "For Rent", cn: "出租", ru: "Аренда" },
  sort_newest: { th: "รายการล่าสุด", en: "Newest", cn: "最新", ru: "Новые" },
  sort_price_asc: { th: "ราคา: ต่ำสุด - สูงสุด", en: "Price: Low to High", cn: "价格：从低到高", ru: "Цена: по возрастанию" },
  sort_price_desc: { th: "ราคา: สูงสุด - ต่ำสุด", en: "Price: High to Low", cn: "价格：从高到低", ru: "Цена: по убыванию" },
  sort_size_asc: { th: "ขนาดห้อง: เล็ก - ใหญ่", en: "Size: Small to Large", cn: "面积：从小到大", ru: "Площадь: по возрастанию" },
  sort_size_desc: { th: "ขนาดห้อง: ใหญ่ - เล็ก", en: "Size: Large to Small", cn: "面积：从大到小", ru: "Площадь: по убыванию" },
  no_listings_title: { th: "ยังไม่มีรายการในทำเลนี้", en: "No listings in this project", cn: "该项目暂无房源", ru: "Нет объявлений в этом проекте" },
  no_listings_desc: { th: "ขณะนี้ยังไม่มีห้องว่างที่ประกาศอยู่ในโครงการนี้ โปรดกลับมาตรวจสอบอีกครั้งในภายหลัง", en: "There are currently no active listings in this project. Please check back later.", cn: "目前该项目暂无房源，请稍后再来查看。", ru: "В настоящее время в этом проекте нет активных объявлений. Пожалуйста, зайдите позже." },
  view_more: { th: "โหลดข้อมูลเพิ่มเติม", en: "Load More", cn: "加载更多", ru: "Показать еще" },
  showing_count: { th: "แสดง {count} จากทั้งหมด {total} รายการ", en: "Showing {count} of {total} listings", cn: "显示 {total} 套房源中的 {count} 套", ru: "Показано {count} из {total} объявлений" },
};

export function ProjectPropertiesClient({ initialProperties, project }: ProjectPropertiesClientProps) {
  const { language } = useLanguage();
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [sort, setSort] = useState<SortType>("newest");
  const [visibleCount, setVisibleCount] = useState(12);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    let val = TRANSLATIONS[key]?.[language] || TRANSLATIONS[key]?.th || "";
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, String(v));
      });
    }
    return val;
  }, [language]);

  // Filter and sort properties
  const filteredAndSorted = useMemo(() => {
    let result = [...initialProperties];

    // 1. Filter
    if (filter === "SALE") {
      result = result.filter(p => p.listing_type === "SALE" || p.listing_type === "SALE_AND_RENT");
    } else if (filter === "RENT") {
      result = result.filter(p => p.listing_type === "RENT" || p.listing_type === "SALE_AND_RENT");
    }

    // 2. Sort
    result.sort((a, b) => {
      if (sort === "price-asc") {
        const priceA = a.price || a.rental_price || 0;
        const priceB = b.price || b.rental_price || 0;
        return priceA - priceB;
      }
      if (sort === "price-desc") {
        const priceA = a.price || a.rental_price || 0;
        const priceB = b.price || b.rental_price || 0;
        return priceB - priceA;
      }
      if (sort === "size-asc") {
        const sizeA = a.size_sqm || 0;
        const sizeB = b.size_sqm || 0;
        return sizeA - sizeB;
      }
      if (sort === "size-desc") {
        const sizeA = a.size_sqm || 0;
        const sizeB = b.size_sqm || 0;
        return sizeB - sizeA;
      }
      // default: newest (featured first, then id/date)
      const featuredA = a.is_featured ? 1 : 0;
      const featuredB = b.is_featured ? 1 : 0;
      if (featuredA !== featuredB) return featuredB - featuredA;
      return b.id.localeCompare(a.id);
    });

    return result;
  }, [initialProperties, filter, sort]);

  const visibleProperties = useMemo(() => {
    return filteredAndSorted.slice(0, visibleCount);
  }, [filteredAndSorted, visibleCount]);

  const hasMore = visibleCount < filteredAndSorted.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 12);
  };

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setVisibleCount(12);
  };

  return (
    <div className="w-full">
      {/* Filtering and Sorting Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-200/60 pb-6 mb-8">
        {/* Listing Type Tabs */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl w-full md:w-auto self-start md:self-auto shadow-inner">
          <button
            onClick={() => handleFilterChange("ALL")}
            className={`flex-1 md:flex-initial px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
              filter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t("tab_all")}
          </button>
          <button
            onClick={() => handleFilterChange("SALE")}
            className={`flex-1 md:flex-initial px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
              filter === "SALE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t("tab_sale")}
          </button>
          <button
            onClick={() => handleFilterChange("RENT")}
            className={`flex-1 md:flex-initial px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
              filter === "RENT" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t("tab_rent")}
          </button>
        </div>

        {/* Sorting Dropdown & Counter */}
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
          <span className="text-xs font-bold text-slate-400 sm:mr-2 self-start sm:self-auto">
            {t("showing_count", { count: visibleProperties.length, total: filteredAndSorted.length })}
          </span>

          <div className="relative w-full sm:w-60 self-stretch sm:self-auto group">
            <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-sm font-bold text-slate-700 hover:text-slate-900 focus:outline-hidden cursor-pointer shadow-xs appearance-none transition-all"
            >
              <option value="newest">{t("sort_newest")}</option>
              <option value="price-asc">{t("sort_price_asc")}</option>
              <option value="price-desc">{t("sort_price_desc")}</option>
              <option value="size-asc">{t("sort_size_asc")}</option>
              <option value="size-desc">{t("sort_size_desc")}</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      {visibleProperties.length > 0 ? (
        <div className="space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {visibleProperties.map((property) => (
              <PropertyCard key={property.id} property={property as any} />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                className="px-8 py-3.5 bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 text-slate-700 hover:text-slate-900 rounded-2xl text-sm font-bold cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md inline-flex items-center gap-2"
              >
                <span>{t("view_more")}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 rounded-3xl bg-white/60 backdrop-blur-xs border border-slate-200/40 shadow-xs">
          <Building className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">{t("no_listings_title")}</h3>
          <p className="text-slate-500 max-w-md mx-auto text-sm px-4 leading-relaxed">
            {t("no_listings_desc")}
          </p>
        </div>
      )}
    </div>
  );
}
