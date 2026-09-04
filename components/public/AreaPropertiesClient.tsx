"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronDown, Grid3X3, SlidersHorizontal, Building2, Check, Loader2 } from "lucide-react";
import { PropertyCard } from "@/components/public/PropertyCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import type { PublicPropertyNearStation } from "@/features/public/stations";

interface AreaPropertiesClientProps {
  initialProperties: PublicPropertyNearStation[];
  initialTotal?: number;
  areaNameTh: string;
  areaName: string;
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
  no_listings_title: { th: "ยังไม่มีรายการในทำเลนี้", en: "No listings in this area", cn: "该区域暂无房源", ru: "Нет объявлений в этом районе" },
  no_listings_desc: { th: "ขณะนี้ยังไม่มีห้องว่างที่ประกาศอยู่ในทำเลนี้ โปรดกลับมาตรวจสอบอีกครั้งในภายหลัง", en: "There are currently no active listings in this area. Please check back later.", cn: "目前该区域暂无房源，请稍后再来查看。", ru: "В настоящее время в этом районе нет активных объявлений. Пожалуйста, зайдите позже." },
  view_more: { th: "โหลดข้อมูลเพิ่มเติม", en: "Load More", cn: "加载更多", ru: "Показать еще" },
  showing_count: { th: "แสดง {count} จากทั้งหมด {total} รายการ", en: "Showing {count} of {total} listings", cn: "显示 {total} 套房源中的 {count} 套", ru: "Показано {count} из {total} объявлений" },
  filter_all_types: { th: "ทุกประเภททรัพย์", en: "All Types", cn: "所有物业类型", ru: "Все типы" },
  property_type: { th: "เลือกประเภททรัพย์สิน", en: "Property Type", cn: "选择物业类型", ru: "Тип недвижимости" },
  sort_by: { th: "จัดเรียงตาม", en: "Sort By", cn: "排序方式", ru: "Сортировка" },
};

export function AreaPropertiesClient({ initialProperties, initialTotal, areaNameTh, areaName }: AreaPropertiesClientProps) {
  const { language, t: globalT } = useLanguage();
  const [properties, setProperties] = useState<PublicPropertyNearStation[]>(initialProperties || []);
  const [totalCount, setTotalCount] = useState<number>(
    initialTotal !== undefined ? initialTotal : (initialProperties || []).length
  );
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>("ALL");
  const [sort, setSort] = useState<SortType>("newest");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  const [propertyTypeDialogOpen, setPropertyTypeDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    let val = TRANSLATIONS[key]?.[language] || TRANSLATIONS[key]?.th || globalT(key, params);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, String(v));
      });
    }
    return val;
  }, [language, globalT]);

  const availablePropertyTypes = useMemo(() => {
    const types = new Set<string>();
    properties.forEach(p => {
      if (p.property_type && typeof p.property_type === "string") {
        types.add(p.property_type.toUpperCase());
      }
    });
    return Array.from(types);
  }, [properties]);

  // Fetch updated properties from API when filters change
  const fetchFilteredProperties = useCallback(async (newFilter: FilterType, newPropType: string) => {
    setIsRefetching(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "12");
      params.set("offset", "0");
      if (newFilter !== "ALL") params.set("listing_type", newFilter);
      if (newPropType !== "ALL") params.set("property_type", newPropType);

      const res = await fetch(`/api/public/areas/${encodeURIComponent(areaNameTh)}/properties?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
        setTotalCount(data.total ?? (data.properties || []).length);
      }
    } catch (err) {
      console.error("Failed to fetch filtered properties in area:", err);
    } finally {
      setIsRefetching(false);
    }
  }, [areaNameTh]);

  // Filter change handlers
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    fetchFilteredProperties(newFilter, propertyTypeFilter);
  };

  const handlePropertyTypeChange = (newPropType: string) => {
    setPropertyTypeFilter(newPropType);
    fetchFilteredProperties(filter, newPropType);
  };

  // Load more properties (+12)
  const handleLoadMore = async () => {
    if (isLoadingMore || properties.length >= totalCount) return;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "12");
      params.set("offset", String(properties.length));
      if (filter !== "ALL") params.set("listing_type", filter);
      if (propertyTypeFilter !== "ALL") params.set("property_type", propertyTypeFilter);

      const res = await fetch(`/api/public/areas/${encodeURIComponent(areaNameTh)}/properties?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const nextBatch: PublicPropertyNearStation[] = data.properties || [];
        setProperties(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const fresh = nextBatch.filter(p => !existingIds.has(p.id));
          return [...prev, ...fresh];
        });
        if (data.total !== undefined) {
          setTotalCount(data.total);
        }
      }
    } catch (err) {
      console.error("Failed to load more properties in area:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Sort loaded properties
  const sortedProperties = useMemo(() => {
    const result = [...properties];

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
      // default: newest (featured first, then is_hot_deal, then created_at)
      const featuredA = a.is_featured ? 1 : 0;
      const featuredB = b.is_featured ? 1 : 0;
      if (featuredA !== featuredB) return featuredB - featuredA;
      
      const hotA = a.is_hot_deal ? 1 : 0;
      const hotB = b.is_hot_deal ? 1 : 0;
      if (hotA !== hotB) return hotB - hotA;

      return (b.created_at || "").localeCompare(a.created_at || "") || b.id.localeCompare(a.id);
    });

    return result;
  }, [properties, sort]);

  const hasMore = properties.length < totalCount;

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/90 p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Listing Type tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-fit">
          <button
            onClick={() => handleFilterChange("ALL")}
            disabled={isRefetching}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
              filter === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t("tab_all")}
          </button>
          <button
            onClick={() => handleFilterChange("SALE")}
            disabled={isRefetching}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
              filter === "SALE"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t("tab_sale")}
          </button>
          <button
            onClick={() => handleFilterChange("RENT")}
            disabled={isRefetching}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
              filter === "RENT"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t("tab_rent")}
          </button>
        </div>

        {/* Sort Select & Info */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-slate-400 font-medium hidden md:inline">
            {t("showing_count", { count: sortedProperties.length, total: totalCount })}
          </span>

          {/* Property Type Filter */}
          {availablePropertyTypes.length > 0 && (
            <>
              {/* Desktop native select */}
              <div className="relative hidden sm:block sm:flex-initial">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={propertyTypeFilter}
                  disabled={isRefetching}
                  onChange={(e) => handlePropertyTypeChange(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all appearance-none cursor-pointer min-w-[140px]"
                >
                  <option value="ALL">{t("filter_all_types")}</option>
                  {availablePropertyTypes.map(type => (
                    <option key={type} value={type}>
                      {t(`property_types.${type.toLowerCase()}`)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Mobile drawer button trigger */}
              <div className="relative flex-1 sm:hidden">
                <button
                  type="button"
                  disabled={isRefetching}
                  onClick={() => setPropertyTypeDialogOpen(true)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-750 transition-all appearance-none cursor-pointer flex items-center justify-between shadow-2xs h-[38px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {propertyTypeFilter === "ALL"
                        ? t("filter_all_types")
                        : t(`property_types.${propertyTypeFilter.toLowerCase()}`)}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                </button>

                <ResponsiveDialog
                  open={propertyTypeDialogOpen}
                  onOpenChange={setPropertyTypeDialogOpen}
                  title={t("property_type")}
                  confirmOnClose={false}
                >
                  <div className="flex flex-col bg-white">
                    <button
                      onClick={() => {
                        handlePropertyTypeChange("ALL");
                        setPropertyTypeDialogOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-6 py-4.5 text-sm font-bold border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${
                        propertyTypeFilter === "ALL" ? "text-indigo-600 bg-indigo-50/20" : "text-slate-700"
                      }`}
                    >
                      <span>{t("filter_all_types")}</span>
                      {propertyTypeFilter === "ALL" && <Check className="w-4.5 h-4.5 text-indigo-650" />}
                    </button>
                    {availablePropertyTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => {
                          handlePropertyTypeChange(type);
                          setPropertyTypeDialogOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-6 py-4.5 text-sm font-bold border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${
                          propertyTypeFilter === type ? "text-indigo-600 bg-indigo-50/20" : "text-slate-700"
                        }`}
                      >
                        <span>{t(`property_types.${type.toLowerCase()}`)}</span>
                        {propertyTypeFilter === type && <Check className="w-4.5 h-4.5 text-indigo-650" />}
                      </button>
                    ))}
                  </div>
                </ResponsiveDialog>
              </div>
            </>
          )}

          {/* Desktop Sort filter select */}
          <div className="relative hidden sm:block sm:flex-initial">
            <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all appearance-none cursor-pointer min-w-[140px]"
            >
              <option value="newest">{t("sort_newest")}</option>
              <option value="price-asc">{t("sort_price_asc")}</option>
              <option value="price-desc">{t("sort_price_desc")}</option>
              <option value="size-asc">{t("sort_size_asc")}</option>
              <option value="size-desc">{t("sort_size_desc")}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Mobile Sort drawer button trigger */}
          <div className="relative flex-1 sm:hidden">
            <button
              type="button"
              onClick={() => setSortDialogOpen(true)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-750 transition-all appearance-none cursor-pointer flex items-center justify-between shadow-2xs h-[38px]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{t(`sort_${sort.replace("-", "_")}` as any)}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            </button>

            <ResponsiveDialog
              open={sortDialogOpen}
              onOpenChange={setSortDialogOpen}
              title={t("sort_by")}
              confirmOnClose={false}
            >
              <div className="flex flex-col bg-white">
                {(["newest", "price-asc", "price-desc", "size-asc", "size-desc"] as SortType[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSort(opt);
                      setSortDialogOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-6 py-4.5 text-sm font-bold border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${
                      sort === opt ? "text-indigo-600 bg-indigo-50/20" : "text-slate-700"
                    }`}
                  >
                    <span>{t(`sort_${opt.replace("-", "_")}` as any)}</span>
                    {sort === opt && <Check className="w-4.5 h-4.5 text-indigo-650" />}
                  </button>
                ))}
              </div>
            </ResponsiveDialog>
          </div>
        </div>
      </div>

      {/* Grid of properties with Loading Transition */}
      <div className={`transition-opacity duration-200 ${isRefetching ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
        {sortedProperties.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4">
              {sortedProperties.map((property) => (
                <PropertyCard key={property.id} property={property as any} />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore || isRefetching}
                  className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-8 py-3.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer text-xs md:text-sm inline-flex items-center gap-2.5 active:scale-95 disabled:opacity-60"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>{t("view_more")}...</span>
                    </>
                  ) : (
                    <>
                      <span>{t("view_more")}</span>
                      {totalCount > sortedProperties.length && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                          +{Math.min(12, totalCount - sortedProperties.length)}
                        </span>
                      )}
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Grid3X3 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{t("no_listings_title")}</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">{t("no_listings_desc")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
