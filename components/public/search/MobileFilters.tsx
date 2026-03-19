"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { PriceRangeSelect } from "./PriceRangeSelect";
import { AreaSizeSelect } from "./AreaSizeSelect";

import { MdOutlinePets as PetIcon, MdWork as WorkIcon } from "react-icons/md";
import { FaFire as FireIcon, FaTrainSubway as TrainIcon } from "react-icons/fa6";
import { GiEarthAmerica as EarthIcon } from "react-icons/gi";
import { RiArmchairFill as ArmchairIcon } from "react-icons/ri";

interface MobileFiltersProps {
  keyword: string;
  setKeyword: (v: string) => void;
  province: string;
  setProvince: (v: string) => void;
  area: string;
  setArea: (v: string) => void;
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
  type: string;
  setType: (v: string) => void;
  listingType: string;
  setListingType: (v: string) => void;
  priceType?: string;
  setPriceType?: (v: string) => void;
  currentPriceOption: any;
  flatPriceOptions: any[];
  priceOptions: any[];
  priceCounts: Map<string, number>;
  setMinPrice: (v: string) => void;
  setMaxPrice: (v: string) => void;
  currentSizeOption: any;
  sizeOptions: any[];
  sizeCounts: Map<string, number>;
  setMinSize: (v: string) => void;
  setMaxSize: (v: string) => void;
  bedrooms: string;
  setBedrooms: (v: string) => void;
  availableProvinces: { name: string; count: number }[];
  availableAreas: any[];
  availableTypes: Record<string, number>;
  filteredLength: number;
  showAllProvincesMobile: boolean;
  setShowAllProvincesMobile: (v: boolean) => void;
  showAllAreasMobile: boolean;
  setShowAllAreasMobile: (v: boolean) => void;
  t: (key: string) => string;
  language: string;
  PROPERTY_TYPES: { value: string; label: string }[];
  getProvinceName: (name: string, lang: string) => string;
  getLocaleValue: (item: any, field: string, lang: string) => string;
  MOBILE_ITEMS_LIMIT: number;
  pushToDataLayer: (event: string, params: any) => void;
  GTM_EVENTS: any;
}

export function MobileFilters({
  keyword,
  setKeyword,
  province,
  setProvince,
  area,
  setArea,
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
  type,
  setType,
  listingType,
  setListingType,
  priceType,
  setPriceType,
  currentPriceOption,
  flatPriceOptions,
  priceOptions,
  priceCounts,
  setMinPrice,
  setMaxPrice,
  currentSizeOption,
  sizeOptions,
  sizeCounts,
  setMinSize,
  setMaxSize,
  bedrooms,
  setBedrooms,
  availableProvinces,
  availableAreas,
  availableTypes,
  filteredLength,
  showAllProvincesMobile,
  setShowAllProvincesMobile,
  showAllAreasMobile,
  setShowAllAreasMobile,
  t,
  language,
  PROPERTY_TYPES,
  getProvinceName,
  getLocaleValue,
  MOBILE_ITEMS_LIMIT,
  pushToDataLayer,
  GTM_EVENTS,
}: MobileFiltersProps) {
  return (
    <div className="xl:hidden flex gap-3 my-4">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input
          placeholder={t("search.keyword_placeholder")}
          className="pl-12 h-12 text-base rounded-xl border-slate-200 bg-white shadow-sm"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="h-12 w-12 p-0 rounded-xl border-slate-200 bg-white shadow-sm shrink-0"
          >
            <SlidersHorizontal className="h-5 w-5 text-slate-600" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="h-[70vh] rounded-t-2xl flex flex-col p-0 bg-slate-50 "
        >
          <SheetHeader className="px-6 py-4 border-b border-slate-100 bg-white text-slate-900 rounded-t-4xl">
            <SheetTitle>{t("search.filter_title")}</SheetTitle>
          </SheetHeader>
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {/* Location Zone */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <Accordion type="single" collapsible defaultValue="location" className="w-full">
                <AccordionItem value="location" className="border-0">
                  <AccordionTrigger className="hover:no-underline py-0">
                    <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
                      {t("search.province")} & {t("search.location")}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-6 px-1">
                    <div className="space-y-3">
                      <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block ml-1">
                        {t("search.province")}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setProvince("ALL");
                            setArea("ALL");
                          }}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                            province === "ALL"
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-slate-50 text-slate-600 border-slate-100 hover:border-blue-300"
                          }`}
                        >
                          {t("search.all_provinces")}
                        </button>
                        {availableProvinces
                          .slice(0, showAllProvincesMobile ? undefined : MOBILE_ITEMS_LIMIT)
                          .map((p) => (
                            <button
                              key={p.name}
                              onClick={() => {
                                setProvince(p.name);
                                setArea("ALL");
                              }}
                              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center justify-between gap-3 ${
                                province === p.name
                                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                  : "bg-slate-50 text-slate-600 border-slate-100 hover:border-blue-300"
                              }`}
                            >
                              <span>{getProvinceName(p.name, language)}</span>
                              <span className={`text-[10px] opacity-70 ${province === p.name ? "text-white" : "text-slate-400"}`}>
                                {p.count}
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block ml-1">
                        {t("search.location")}
                      </label>
                      <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        <button
                          onClick={() => setArea("ALL")}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                            area === "ALL"
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-slate-50 text-slate-600 border-slate-100 hover:border-blue-300"
                          }`}
                        >
                          {t("search.all_locations")}
                        </button>
                        {availableAreas
                          .slice(0, showAllAreasMobile ? undefined : MOBILE_ITEMS_LIMIT)
                          .map((a) => (
                            <button
                              key={a.name}
                              onClick={() => setArea(a.name)}
                              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                area === a.name
                                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                  : "bg-slate-50 text-slate-600 border-slate-100 hover:border-blue-300"
                              }`}
                            >
                              {getLocaleValue({ name: a.name, name_en: a.name_en, name_cn: a.name_cn }, "name", language)}
                            </button>
                          ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Quick Filters Zone */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                {t("search.quick_filters")}
              </span>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {[
                  { state: nearTrain, setState: setNearTrain, icon: TrainIcon, label: "near_train", color: "blue", size: "h-5 w-5" },
                  { state: petFriendly, setState: setPetFriendly, icon: PetIcon, label: "pet_allowed", color: "orange", size: "h-6 w-6" },
                  { state: fullyFurnished, setState: setFullyFurnished, icon: ArmchairIcon, label: "fully_furnished", color: "emerald", size: "h-6 w-6" },
                  { state: isForeigner, setState: setIsForeigner, icon: EarthIcon, label: "foreigner", color: "purple", size: "h-6 w-6" },
                  { state: companyRegistered, setState: setCompanyRegistered, icon: WorkIcon, label: "company_registered", color: "indigo", size: "h-6 w-6" },
                  { state: isHotDeal, setState: setIsHotDeal, icon: FireIcon, label: "hot_deal", color: "rose", size: "h-[22px] w-[22px]" },
                ].map((f) => (
                  <div
                    key={f.label}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 px-2 py-4 rounded-2xl border-2 transition-colors duration-200 cursor-pointer",
                      f.state
                        ? `bg-${f.color}-600 border-${f.color}-600 text-white shadow-md shadow-${f.color}-500/20`
                        : "bg-slate-50 border-transparent text-slate-600 hover:border-slate-200"
                    )}
                    onClick={() => f.setState(!f.state)}
                  >
                    <f.icon className={cn(f.size, f.state ? "text-white" : `text-${f.color}-500`)} />
                    <span className="text-[10px] font-medium text-center leading-tight">
                      {t(`search.${f.label}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Property Detail Zone */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-purple-500 rounded-full" />
                {t("search.property_details")}
              </span>
              
              <div className="space-y-3">
                <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block ml-1">
                  {t("search.property_type")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map((pt) => {
                    const count = availableTypes[pt.value] || 0;
                    const hasItems = pt.value === "ALL" || count > 0;
                    const isActive = type === pt.value;

                    return (
                      <button
                        key={pt.value}
                        disabled={!hasItems}
                        onClick={() => {
                          setType(pt.value);
                          pushToDataLayer(GTM_EVENTS.SEARCH_FILTER, {
                            filter_type: "property_type",
                            filter_value: pt.value,
                            province,
                            popular_area: area,
                            item_category: pt.value,
                            listing_type: listingType,
                          });
                        }}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center gap-3 ${
                          isActive
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : hasItems
                              ? "bg-slate-50 text-slate-600 border-slate-100 hover:border-blue-300"
                              : "bg-slate-50 text-slate-300 border-transparent opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <span>{pt.label}</span>
                        {count > 0 && pt.value !== "ALL" && (
                          <span className={`text-[10px] opacity-70 ${isActive ? "text-white" : "text-emerald-500"}`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-900">{t("search.needs")}</label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                  {[
                    { val: "ALL", label: t("common.all") },
                    { val: "SALE", label: t("search.buy") },
                    { val: "RENT", label: t("search.rent") },
                    { val: "SALE_AND_RENT", label: t("search.rent_buy") },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => {
                        setListingType(opt.val);
                        pushToDataLayer(GTM_EVENTS.SEARCH_FILTER, {
                          filter_type: "listing_type",
                          filter_value: opt.val,
                          province,
                          popular_area: area,
                          item_category: type,
                          listing_type: opt.val
                        });
                      }}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                        listingType === opt.val
                          ? "bg-slate-900 text-white shadow-md"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-900">{t("search.price_range")}</label>
                <PriceRangeSelect
                  currentPriceOption={currentPriceOption}
                  flatPriceOptions={flatPriceOptions}
                  priceOptions={priceOptions}
                  priceCounts={priceCounts}
                  setMinPrice={setMinPrice}
                  setMaxPrice={setMaxPrice}
                  setPriceType={setPriceType}
                  placeholder={t("search.price_range")}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-900">{t("search.area_size")}</label>
                <AreaSizeSelect
                  currentSizeOption={currentSizeOption}
                  sizeOptions={sizeOptions}
                  sizeCounts={sizeCounts}
                  setMinSize={setMinSize}
                  setMaxSize={setMaxSize}
                  placeholder={t("search.area_size") || "ขนาดพื้นที่"}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-900">{t("search.bedrooms")}</label>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {["ALL", "1", "2", "3", "4+"].map((bed) => (
                    <button
                      key={bed}
                      onClick={() => setBedrooms(bed)}
                      className={`h-10 min-w-12 px-3 rounded-xl border transition-all font-medium text-sm shrink-0 ${
                        bedrooms === bed
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      {bed === "ALL" ? t("common.all") : bed}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="p-6 border-t border-slate-100 bg-white pb-8">
            <SheetClose asChild>
              <Button className="w-full h-12 text-lg rounded-xl bg-linear-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-200/50">
                {t("search.view_results")} ({filteredLength} {t("search.items")})
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
