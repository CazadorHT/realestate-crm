"use client";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MagicAiSearch } from "./MagicAiSearch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  Maximize2,
  Minimize2,
  DollarSign,
  Maximize,
} from "lucide-react";
import {
  FaFire as FireIcon,
  FaTrainSubway as TrainIcon,
} from "react-icons/fa6";
import { PriceRangeSelect } from "./PriceRangeSelect";
import { AreaSizeSelect } from "./AreaSizeSelect";
import { QuickFeatureFilters } from "./QuickFeatureFilters";
import { cn } from "@/lib/utils";

interface DesktopFiltersProps {
  keyword: string;
  setKeyword: (v: string) => void;
  province: string;
  setProvince: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  listingType: string;
  setListingType: (v: string) => void;
  sort: string;
  setSort: (v: string) => void;
  currentPriceOption: any;
  flatPriceOptions: any[];
  priceOptions: any[];
  priceCounts: Map<string, number>;
  setMinPrice: (v: string) => void;
  setMaxPrice: (v: string) => void;
  setPriceType?: (v: string) => void;
  currentSizeOption: any;
  sizeOptions: any[];
  sizeCounts: Map<string, number>;
  setMinSize: (v: string) => void;
  setMaxSize: (v: string) => void;
  bedrooms: string;
  setBedrooms: (v: string) => void;
  nearTrain: boolean;
  setNearTrain: (v: boolean) => void;
  petFriendly: boolean;
  setPetFriendly: (v: boolean) => void;
  fullyFurnished: boolean;
  setFullyFurnished: (v: boolean) => void;
  isForeigner: boolean;
  setIsForeigner: (v: boolean) => void;
  companyRegistered: boolean;
  setCompanyRegistered: (v: boolean) => void;
  isHotDeal: boolean;
  setIsHotDeal: (v: boolean) => void;
  availableBedrooms: Record<string, number>;
  availableStations: {
    name: string;
    count: number;
    type: string;
    name_en?: string | null;
    name_cn?: string | null;
    name_ru?: string | null;
  }[];
  availableProvinces: { name: string; count: number }[];
  availableTypes: Record<string, number>;
  availableListingTypes: Record<string, number>;
  availableQuickFilters: Record<string, number>;
  availableAreas: any[];
  area: string;
  setArea: (v: string) => void;
  showAreaSection: boolean;
  setShowAreaSection: (v: boolean) => void;
  isExpanded: boolean;
  setIsExpanded: (v: boolean) => void;
  clearFilters: () => void;
  t: (key: string) => string;
  language: string;
  PROPERTY_TYPES: { value: string; label: string }[];
  getProvinceName: (name: string, lang: string) => string;
  getLocaleValue: (obj: any, field: string, lang: string) => string;
  transitStation: string;
  setTransitStation: (v: string) => void;
  minPrice: string;
  maxPrice: string;
  minSize: string;
  maxSize: string;
  setBulkFilters: (updates: any) => void;
}

const Badge = ({
  label,
  onClear,
  variant = "blue",
  icon,
}: {
  label: string;
  onClear: () => void;
  variant?: "blue" | "slate" | "emerald" | "purple" | "rose";
  icon?: React.ReactNode;
}) => {
  const variants = {
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    slate: "bg-slate-50 border-slate-200 text-slate-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    purple: "bg-purple-50 border-purple-100 text-purple-700",
    rose: "bg-rose-50 border-rose-100 text-rose-700",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-xs font-bold shadow-sm transition-all animate-in zoom-in-95",
        variants[variant],
      )}
    >
      {icon}
      <span>{label}</span>
      <button
        onClick={onClear}
        className="ml-1 p-0.5 rounded-full hover:bg-black/5 transition-colors"
      >
        <svg
          className="w-2.5 h-2.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

export function DesktopFilters({
  keyword,
  setKeyword,
  province,
  setProvince,
  type,
  setType,
  listingType,
  setListingType,
  sort,
  setSort,
  currentPriceOption,
  flatPriceOptions,
  priceOptions,
  priceCounts,
  setMinPrice,
  setMaxPrice,
  setPriceType,
  currentSizeOption,
  sizeOptions,
  sizeCounts,
  setMinSize,
  setMaxSize,
  bedrooms,
  setBedrooms,
  nearTrain,
  setNearTrain,
  petFriendly,
  setPetFriendly,
  fullyFurnished,
  setFullyFurnished,
  isForeigner,
  setIsForeigner,
  companyRegistered,
  setCompanyRegistered,
  isHotDeal,
  setIsHotDeal,
  availableBedrooms,
  availableStations,
  availableProvinces,
  availableTypes,
  availableListingTypes,
  availableQuickFilters,
  availableAreas,
  area,
  setArea,
  showAreaSection,
  setShowAreaSection,
  isExpanded,
  setIsExpanded,
  clearFilters,
  t,
  language,
  PROPERTY_TYPES,
  getProvinceName,
  getLocaleValue,
  transitStation,
  setTransitStation,
  minPrice,
  maxPrice,
  minSize,
  maxSize,
  setBulkFilters,
}: DesktopFiltersProps) {
  const [trainTypeFilter, setTrainTypeFilter] = useState<string>("ALL");

  const trainTypes = useMemo(() => {
    const types = new Set(availableStations.map((s) => s.type));
    return Array.from(types).filter(Boolean).sort();
  }, [availableStations]);

  const filteredStations = useMemo(() => {
    if (trainTypeFilter === "ALL") return availableStations;
    return availableStations.filter((s) => s.type === trainTypeFilter);
  }, [availableStations, trainTypeFilter]);

  const hasActiveFilters = useMemo(() => {
    return (
      keyword !== "" ||
      province !== "ALL" ||
      type !== "ALL" ||
      listingType !== "ALL" ||
      area !== "ALL" ||
      transitStation !== "" ||
      minPrice !== "0" ||
      maxPrice !== "0" ||
      minSize !== "0" ||
      maxSize !== "0" ||
      bedrooms !== "ALL" ||
      petFriendly ||
      fullyFurnished ||
      isForeigner ||
      companyRegistered ||
      isHotDeal
    );
  }, [
    keyword,
    province,
    type,
    listingType,
    area,
    transitStation,
    minPrice,
    maxPrice,
    minSize,
    maxSize,
    bedrooms,
    petFriendly,
    fullyFurnished,
    isForeigner,
    companyRegistered,
    isHotDeal,
  ]);

  const hasBadges = useMemo(() => {
    return (
      province !== "ALL" ||
      type !== "ALL" ||
      listingType !== "ALL" ||
      area !== "ALL" ||
      transitStation !== "" ||
      minPrice !== "0" ||
      maxPrice !== "0" ||
      minSize !== "0" ||
      maxSize !== "0" ||
      bedrooms !== "ALL" ||
      petFriendly ||
      fullyFurnished ||
      isForeigner ||
      companyRegistered ||
      isHotDeal
    );
  }, [
    province,
    type,
    listingType,
    area,
    transitStation,
    minPrice,
    maxPrice,
    minSize,
    maxSize,
    bedrooms,
    petFriendly,
    fullyFurnished,
    isForeigner,
    companyRegistered,
    isHotDeal,
  ]);

  const formatPrice = (val: string) => {
    const num = parseInt(val);
    if (isNaN(num)) return val;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    return num.toLocaleString();
  };

  return (
    <div className="hidden xl:block">
      {/* Row 1: Core Search */}
      <div className="grid grid-cols-12 gap-2 mb-3">
        <div className="col-span-3 ">
          <MagicAiSearch keyword={keyword} setKeyword={setKeyword} />
        </div>

        <div className="col-span-2">
          <Select
            value={province}
            onValueChange={(val) => {
              setProvince(val);
              setArea("ALL");
            }}
          >
            <SelectTrigger className="h-10! w-full rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all text-xs">
              <SelectValue placeholder={t("search.province")} />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="ALL">{t("search.all_provinces")}</SelectItem>
              {availableProvinces.map((p) => (
                <SelectItem
                  key={p.name}
                  value={p.name}
                  disabled={p.count === 0}
                >
                  <div className="flex items-center justify-between w-full gap-4">
                    <span className={p.count === 0 ? "text-slate-400" : ""}>
                      {getProvinceName(p.name, language)}
                    </span>
                    <span
                      className={`text-xs ${p.count === 0 ? "text-slate-300" : "text-blue-500"}`}
                    >
                      ({p.count})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-10! w-full rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all text-xs">
              <SelectValue placeholder={t("search.property_type")} />
            </SelectTrigger>
            <SelectContent align="start">
              {PROPERTY_TYPES.map((pt) => {
                const count = availableTypes[pt.value] || 0;
                const isDisabled = count === 0 && pt.value !== "ALL";
                return (
                  <SelectItem
                    key={pt.value}
                    value={pt.value}
                    disabled={isDisabled}
                  >
                    <div className="flex items-center justify-between w-full gap-4">
                      <span
                        className={
                          pt.value !== "ALL" && count === 0
                            ? "text-slate-400"
                            : ""
                        }
                      >
                        {pt.label}
                      </span>
                      {pt.value !== "ALL" && (
                        <span
                          className={`text-xs ${count === 0 ? "text-slate-300" : "text-blue-500"}`}
                        >
                          ({count})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-3">
          <div className="grid grid-cols-4 gap-1 h-10! bg-white  rounded-xl border border-slate-200 shadow-sm">
            {[
              {
                val: "ALL",
                label: t("common.all"),
                active: "bg-slate-600 border-slate-600",
              },
              {
                val: "SALE",
                label: t("search.buy"),
                active: "bg-green-600 border-green-600",
              },
              {
                val: "RENT",
                label: t("search.rent"),
                active: "bg-orange-600 border-orange-600",
              },
              {
                val: "SALE_AND_RENT",
                label: t("search.rent_buy"),
                active: "bg-blue-600 border-blue-600",
              },
            ].map((opt) => {
              const count = availableListingTypes[opt.val] || 0;
              const isDisabled = count === 0 && opt.val !== "ALL";
              return (
                <button
                  key={opt.val}
                  disabled={isDisabled}
                  onClick={() => setListingType(opt.val)}
                  className={`rounded-lg transition-all font-medium text-xs ${
                    listingType === opt.val
                      ? `${opt.active} text-white shadow-sm`
                      : isDisabled
                        ? "text-slate-300 bg-slate-50 cursor-not-allowed opacity-60"
                        : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="col-span-2">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full h-10! rounded-xl border-slate-200 bg-white text-xs">
              <SelectValue placeholder={t("search.sort_by")} />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="NEWEST">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>{t("search.sort_newest")}</span>
                </div>
              </SelectItem>
              <SelectItem value="PRICE_ASC">
                <div className="flex items-center gap-2">
                  <ArrowUpNarrowWide className="h-4 w-4 text-emerald-500" />
                  <span>{t("search.sort_price_asc")}</span>
                </div>
              </SelectItem>
              <SelectItem value="PRICE_DESC">
                <div className="flex items-center gap-2">
                  <ArrowDownWideNarrow className="h-4 w-4 text-rose-500" />
                  <span>{t("search.sort_price_desc")}</span>
                </div>
              </SelectItem>
              <SelectItem value="AREA_ASC">
                <div className="flex items-center gap-2">
                  <Minimize2 className="h-4 w-4 text-blue-500" />
                  <span>{t("search.sort_area_asc")}</span>
                </div>
              </SelectItem>
              <SelectItem value="AREA_DESC">
                <div className="flex items-center gap-2">
                  <Maximize2 className="h-4 w-4 text-indigo-500" />
                  <span>{t("search.sort_area_desc")}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Secondary Filters */}
      <div className="flex items-center gap-2 mb-3">
        <PriceRangeSelect
          currentPriceOption={currentPriceOption}
          flatPriceOptions={flatPriceOptions}
          priceOptions={priceOptions}
          priceCounts={priceCounts}
          setMinPrice={setMinPrice}
          setMaxPrice={setMaxPrice}
          setPriceType={setPriceType}
          placeholder={t("search.price_range")}
          className="w-[180px]"
        />

        <AreaSizeSelect
          currentSizeOption={currentSizeOption}
          sizeOptions={sizeOptions}
          sizeCounts={sizeCounts}
          setMinSize={setMinSize}
          setMaxSize={setMaxSize}
          placeholder={t("search.area_size") || "ขนาดพื้นที่"}
          className="w-[170px]"
        />

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm h-10">
          <span className="text-xs text-slate-500 font-medium px-2">
            {t("search.bedrooms")}
          </span>
          {["ALL", "1", "2", "3", "4+"].map((bed) => {
            const count = availableBedrooms[bed] || 0;
            const isDisabled = count === 0 && bed !== "ALL";

            return (
              <button
                key={bed}
                disabled={isDisabled}
                onClick={() => setBedrooms(bed)}
                className={`h-8 px-3 rounded-lg transition-all font-medium text-xs flex items-center gap-1.5 ${
                  bedrooms === bed
                    ? "bg-indigo-600 text-white shadow-sm"
                    : isDisabled
                      ? "text-slate-300 bg-slate-50 cursor-not-allowed opacity-60"
                      : "text-slate-600 hover:bg-indigo-50"
                }`}
              >
                <span>{bed === "ALL" ? t("common.all") : bed}</span>
              </button>
            );
          })}
        </div>

        <QuickFeatureFilters
          nearTrain={nearTrain}
          setNearTrain={setNearTrain}
          petFriendly={petFriendly}
          setPetFriendly={setPetFriendly}
          fullyFurnished={fullyFurnished}
          setFullyFurnished={setFullyFurnished}
          isForeigner={isForeigner}
          setIsForeigner={setIsForeigner}
          companyRegistered={companyRegistered}
          setCompanyRegistered={setCompanyRegistered}
          isHotDeal={isHotDeal}
          setIsHotDeal={setIsHotDeal}
          availableQuickFilters={availableQuickFilters}
          t={t}
        />
      </div>

      {/* Unified Active Filters Bar */}
      {hasActiveFilters && (
        <div className="flex items-start justify-between gap-4 mb-4 p-3 bg-slate-50/50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-left-2">
          <div className="flex items-start gap-3 flex-1 flex-wrap">
            <div className="h-[30px] flex items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                {t("search.active_filters")}:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {listingType !== "ALL" && (
                <Badge
                  label={t(`search.listing_${listingType.toLowerCase()}`)}
                  onClear={() => setListingType("ALL")}
                  variant="blue"
                />
              )}
              {type !== "ALL" && (
                <Badge
                  label={
                    PROPERTY_TYPES.find((pt) => pt.value === type)?.label ||
                    type
                  }
                  onClear={() => setType("ALL")}
                  variant="blue"
                />
              )}
              {province !== "ALL" && (
                <Badge
                  label={getProvinceName(province, language)}
                  onClear={() => setProvince("ALL")}
                  variant="slate"
                />
              )}
              {area !== "ALL" && (
                <Badge
                  label={(() => {
                    const found = availableAreas.find((a) => a.name === area);
                    if (!found) return area.replace("_", " ");
                    return getLocaleValue(
                      {
                        name: found.name,
                        name_en: found.name_en,
                        name_cn: found.name_cn,
                        name_ru: found.name_ru,
                      },
                      "name",
                      language,
                    );
                  })()}
                  onClear={() => setArea("ALL")}
                  variant="slate"
                />
              )}
              {transitStation && (
                <Badge
                  label={(() => {
                    const found = availableStations.find(
                      (s) => s.name === transitStation,
                    );
                    if (!found) return transitStation.replace("_", " ");
                    return getLocaleValue(
                      {
                        name: found.name,
                        name_en: found.name_en,
                        name_cn: found.name_cn,
                        name_ru: found.name_ru,
                      },
                      "name",
                      language,
                    ).replace("_", " ");
                  })()}
                  onClear={() => setTransitStation("")}
                  variant="blue"
                  icon={<TrainIcon className="w-3 h-3" />}
                />
              )}
              {bedrooms !== "ALL" && (
                <Badge
                  label={`${bedrooms} ${t("search.bedrooms")}`}
                  onClear={() => setBedrooms("ALL")}
                  variant="slate"
                />
              )}
              {/* Price Badge */}
              {((minPrice && minPrice !== "0") ||
                (maxPrice && maxPrice !== "0")) && (
                <Badge
                  label={
                    minPrice && minPrice !== "0" && maxPrice && maxPrice !== "0"
                      ? `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
                      : minPrice && minPrice !== "0"
                        ? `> ${formatPrice(minPrice)}`
                        : `< ${formatPrice(maxPrice)}`
                  }
                  onClear={() => {
                    setMinPrice("0");
                    setMaxPrice("0");
                  }}
                  variant="emerald"
                  icon={<DollarSign className="w-3 h-3" />}
                />
              )}

              {/* Size Badge */}
              {((minSize && minSize !== "0") ||
                (maxSize && maxSize !== "0")) && (
                <Badge
                  label={
                    minSize && minSize !== "0" && maxSize && maxSize !== "0"
                      ? `${minSize} - ${maxSize} sqm`
                      : minSize && minSize !== "0"
                        ? `> ${minSize} sqm`
                        : `< ${maxSize} sqm`
                  }
                  onClear={() => {
                    setMinSize("0");
                    setMaxSize("0");
                  }}
                  variant="emerald"
                  icon={<Maximize className="w-3 h-3" />}
                />
              )}
              {petFriendly && (
                <Badge
                  label={t("search.pet_friendly")}
                  onClear={() => setPetFriendly(false)}
                  variant="purple"
                />
              )}
              {fullyFurnished && (
                <Badge
                  label={t("search.fully_furnished")}
                  onClear={() => setFullyFurnished(false)}
                  variant="purple"
                />
              )}
              {isForeigner && (
                <Badge
                  label={t("search.foreigner")}
                  onClear={() => setIsForeigner(false)}
                  variant="purple"
                />
              )}
              {companyRegistered && (
                <Badge
                  label={t("search.company_registered")}
                  onClear={() => setCompanyRegistered(false)}
                  variant="purple"
                />
              )}
              {isHotDeal && (
                <Badge
                  label={t("search.hot_deal")}
                  onClear={() => setIsHotDeal(false)}
                  variant="rose"
                  icon={<FireIcon className="w-3 h-3" />}
                />
              )}
            </div>
          </div>

          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            {t("search.clear_all")}
          </button>
        </div>
      )}

      {/* Row 3: Popular Areas */}
      {availableAreas.length > 0 && (
        <div className="flex items-center gap-3 py-3 border-t border-slate-100">
          <button
            onClick={() => setShowAreaSection(!showAreaSection)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-all"
          >
            {t("search.popular_locations")}
            {showAreaSection ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {showAreaSection && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 animate-in fade-in slide-in-from-top-1">
              <button
                onClick={() => setArea("ALL")}
                className={`text-xs transition-colors ${area === "ALL" ? "font-semibold text-blue-600" : "text-slate-400 hover:text-blue-600"}`}
              >
                {t("search.all_locations")}
              </button>
              {availableAreas
                .slice(0, isExpanded ? undefined : 12)
                .map((a: any) => (
                  <button
                    key={a.name}
                    disabled={a.count === 0}
                    onClick={() => setArea(area === a.name ? "ALL" : a.name)}
                    className={`text-xs transition-colors flex items-center gap-1.5 ${
                      area === a.name
                        ? "font-bold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-lg"
                        : a.count === 0
                          ? "text-slate-300 cursor-not-allowed opacity-60"
                          : "text-slate-400 hover:text-blue-600"
                    }`}
                  >
                    {area === a.name && (
                      <svg
                        className="w-3.5 h-3.5 animate-in zoom-in-50"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    {getLocaleValue(
                      {
                        name: a.name,
                        name_en: a.name_en,
                        name_cn: a.name_cn,
                        name_ru: a.name_ru,
                      },
                      "name",
                      language,
                    )}
                    <span
                      className={`text-xs ${a.count === 0 ? "opacity-30" : "opacity-60 text-blue-600"}`}
                    >
                      ({a.count})
                    </span>
                  </button>
                ))}
              {availableAreas.length > 12 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs font-bold text-slate-300 hover:text-slate-500"
                >
                  {isExpanded
                    ? t("search.show_less")
                    : `+${availableAreas.length - 12} ${t("search.show_more")}`}
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {/* Row 4: Transit Stations (When nearTrain is active) */}
      {nearTrain && availableStations.length > 0 && (
        <div className="flex items-center gap-x-6 gap-y-3 flex-wrap pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-1">
          {/* Label */}
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider whitespace-nowrap">
            <TrainIcon className="w-4 h-4 text-blue-600" />
            {t("search.near_train")}
          </div>

          {/* Train Type Selector */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100/50 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setTrainTypeFilter("ALL")}
              className={cn(
                "px-1.5 py-0.5 rounded-lg text-xs font-bold transition-all",
                trainTypeFilter === "ALL"
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                  : "text-slate-400 hover:text-slate-600",
              )}
            >
              {t("search.all")}
            </button>
            {trainTypes.map((type: string) => (
              <button
                key={type}
                onClick={() => setTrainTypeFilter(type)}
                className={cn(
                  "px-1.5 py-0.5 rounded-lg text-xs font-bold transition-all",
                  trainTypeFilter === type
                    ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Station List - Now flows on the same line */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              onClick={() => setTransitStation("")}
              className={`text-xs transition-colors ${!transitStation ? "font-semibold text-blue-600" : "text-slate-400 hover:text-blue-600"}`}
            >
              {t("search.all_stations")}
            </button>
            {filteredStations.slice(0, 20).map((s: any) => (
              <button
                key={s.name}
                onClick={() =>
                  setTransitStation(transitStation === s.name ? "" : s.name)
                }
                className={`text-xs transition-colors flex items-center gap-1.5 ${
                  transitStation === s.name
                    ? "font-bold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-lg"
                    : "text-slate-400 hover:text-blue-600"
                }`}
              >
                {transitStation === s.name ? (
                  <svg
                    className="w-3.5 h-3.5 animate-in zoom-in-50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      s.type === "BTS"
                        ? "bg-green-500"
                        : s.type === "MRT"
                          ? "bg-blue-600"
                          : "bg-slate-400",
                    )}
                  />
                )}
                {getLocaleValue(
                  {
                    name: s.name,
                    name_en: s.name_en,
                    name_cn: s.name_cn,
                    name_ru: s.name_ru,
                  },
                  "name",
                  language,
                ).replace("_", " ")}
                <span className="text-xs opacity-60 text-blue-600">
                  ({s.count})
                </span>
              </button>
            ))}
            {filteredStations.length > 20 && (
              <span className="text-xs text-slate-300 italic">
                +{filteredStations.length - 20} {t("search.more")}
              </span>
            )}

            {filteredStations.length === 0 && (
              <span className="text-xs text-slate-400 italic py-1">
                {t("search.no_stations_type")}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
