"use client";
import { useState } from "react";
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
} from "lucide-react";
import { PriceRangeSelect } from "./PriceRangeSelect";
import { AreaSizeSelect } from "./AreaSizeSelect";
import { QuickFeatureFilters } from "./QuickFeatureFilters";

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
  getLocaleValue: (item: any, field: string, lang: string) => string;
  setBulkFilters: (updates: any) => void;
}

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
  setBulkFilters,
}: DesktopFiltersProps) {
  return (
    <div className="hidden xl:block">
      {/* Row 1: Core Search */}
      <div className="grid grid-cols-12 gap-3 mb-4">
        <div className="col-span-3">
          <MagicAiSearch 
            keyword={keyword} 
            setKeyword={setKeyword} 
          />
        </div>

        <div className="col-span-2">
          <Select
            value={province}
            onValueChange={(val) => {
              setProvince(val);
              setArea("ALL");
            }}
          >
            <SelectTrigger className="h-12! w-full rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
              <SelectValue placeholder={t("search.province")} />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="ALL">{t("search.all_provinces")}</SelectItem>
              {availableProvinces.map((p) => (
                <SelectItem key={p.name} value={p.name} disabled={p.count === 0}>
                  <div className="flex items-center justify-between w-full gap-4">
                    <span className={p.count === 0 ? "text-slate-400" : ""}>
                      {getProvinceName(p.name, language)}
                    </span>
                    <span className={`text-xs ${p.count === 0 ? "text-slate-300" : "text-blue-500"}`}>
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
            <SelectTrigger className="h-12! w-full rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
              <SelectValue placeholder={t("search.property_type")} />
            </SelectTrigger>
            <SelectContent align="start">
              {PROPERTY_TYPES.map((pt) => {
                const count = availableTypes[pt.value] || 0;
                const isDisabled = count === 0 && pt.value !== "ALL";
                return (
                  <SelectItem key={pt.value} value={pt.value} disabled={isDisabled}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span className={pt.value !== "ALL" && count === 0 ? "text-slate-400" : ""}>
                        {pt.label}
                      </span>
                      {pt.value !== "ALL" && (
                        <span className={`text-xs ${count === 0 ? "text-slate-300" : "text-blue-500"}`}>
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
          <div className="grid grid-cols-4 gap-1 h-12! bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {[
              { val: "ALL", label: t("common.all"), active: "bg-slate-600 border-slate-600" },
              { val: "SALE", label: t("search.buy"), active: "bg-green-600 border-green-600" },
              { val: "RENT", label: t("search.rent"), active: "bg-orange-600 border-orange-600" },
              { val: "SALE_AND_RENT", label: t("search.rent_buy"), active: "bg-blue-600 border-blue-600" },
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
            <SelectTrigger className="w-full h-12! rounded-xl border-slate-200 bg-white ">
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
      <div className="flex items-center gap-3 mb-4">
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

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm h-12">
          <span className="text-xs text-slate-500 font-medium px-2">{t("search.bedrooms")}</span>
          {["ALL", "1", "2", "3", "4+"].map((bed) => {
            const count = availableBedrooms[bed] || 0;
            const isDisabled = count === 0 && bed !== "ALL";
            
            return (
              <button
                key={bed}
                disabled={isDisabled}
                onClick={() => setBedrooms(bed)}
                className={`h-9 px-3 rounded-lg transition-all font-medium text-sm flex items-center gap-1.5 ${
                  bedrooms === bed 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : isDisabled
                      ? "text-slate-300 bg-slate-50 cursor-not-allowed opacity-60"
                      : "text-slate-600 hover:bg-indigo-50"
                }`}
              >
                <span>{bed === "ALL" ? t("common.all") : bed}</span>
                {/* {bed !== "ALL" && count > 0 && (
                  <span className={`text-[10px] ${bedrooms === bed ? "text-indigo-200" : "text-blue-400"}`}>
                    ({count})
                  </span>
                )} */}
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

        <div className="ml-auto flex items-center gap-3">
          <Button
            variant="outline"
            onClick={clearFilters}
            className="h-12 px-5 rounded-xl border-2 border-slate-100 text-slate-500 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 font-medium transition-all"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2 text-rose-500" />
            {t("search.clear_filters")}
          </Button>
        </div>
      </div>

      {/* Row 3: Popular Areas */}
      {availableAreas.length > 0 && (
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => setShowAreaSection(!showAreaSection)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-all"
          >
            {t("search.popular_locations")}
            {showAreaSection ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showAreaSection && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 animate-in fade-in slide-in-from-top-1">
              <button
                onClick={() => setArea("ALL")}
                className={`text-sm transition-colors ${area === "ALL" ? "font-semibold text-blue-600" : "text-slate-400 hover:text-blue-600"}`}
              >
                {t("search.all_locations")}
              </button>
              {availableAreas.slice(0, isExpanded ? undefined : 12).map((a) => (
                <button
                  key={a.name}
                  disabled={a.count === 0}
                  onClick={() => setArea(a.name)}
                  className={`text-sm transition-colors flex items-center gap-1.5 ${
                    area === a.name 
                      ? "font-bold text-blue-600" 
                      : a.count === 0
                        ? "text-slate-300 cursor-not-allowed opacity-60"
                        : "text-slate-400 hover:text-blue-600"
                  }`}
                >
                  {getLocaleValue({ name: a.name, name_en: a.name_en, name_cn: a.name_cn, name_ru: a.name_ru }, "name", language)}
                  <span className={`text-sm ${a.count === 0 ? "opacity-30" : "opacity-60 text-blue-600"}`}>({a.count})</span>
                </button>
              ))}
              {availableAreas.length > 12 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-sm font-bold text-slate-300 hover:text-slate-500"
                >
                  {isExpanded ? t("search.show_less") : `+${availableAreas.length - 12} ${t("search.show_more")}`}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
