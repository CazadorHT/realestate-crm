"use client";

import React, { useState, useEffect, useRef } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Search, 
  Send, 
  Loader2, 
  MapPin, 
  Tag, 
  Key,
  Repeat,
  Home,
  Map,
  Briefcase,
  Store,
  CheckCircle2,
  Filter,
  X,
  Sparkles,
  SlidersHorizontal,
  Train,
  PawPrint,
  Armchair,
  Globe,
  ShoppingBag,
  Flame,
  Building,
  ChevronDown
} from "lucide-react";
import { searchPropertiesAction } from "@/features/leads/actions";
import { sendPropertyCardAction } from "../actions";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";
import { StationSearchSelect } from "@/components/public/search/StationSearchSelect";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { translateLocation } from "@/lib/utils/provinces";
import { m, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface FilterDropdownOption {
  id: string;
  label: string;
  count?: number;
  badgeClass?: string;
  group?: string;
}

interface FilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterDropdownOption[];
  placeholder: string;
  allLabel?: string;
  allCount?: number;
  className?: string;
  align?: "left" | "right";
  buttonHeight?: string;
}

function FilterDropdown({
  value,
  onChange,
  options,
  placeholder,
  allLabel,
  allCount,
  className,
  align = "left",
  buttonHeight = "h-10",
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const selectedOpt = options.find((o) => o.id === value);
  const displayText = value === "ALL" ? (allLabel || placeholder) : (selectedOpt?.label || placeholder);

  return (
    <div ref={containerRef} className={cn("relative inline-block", isOpen ? "z-50" : "z-0", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3 rounded-xl bg-white border border-slate-200 text-xs font-medium flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 transition-all cursor-pointer text-slate-700 select-none",
          buttonHeight,
          isOpen && "border-blue-500 ring-2 ring-blue-500/20"
        )}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full mt-1.5 w-56 max-h-64 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-2xl py-1 z-[9999] animate-in fade-in-0 zoom-in-95",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {allLabel && (
            <button
              type="button"
              onClick={() => {
                onChange("ALL");
                setIsOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 text-xs flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer",
                value === "ALL" ? "bg-blue-50/70 text-blue-700 font-bold" : "text-slate-700"
              )}
            >
              <span>{allLabel}</span>
              {allCount !== undefined && allCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {allCount}
                </span>
              )}
            </button>
          )}

          {options.map((opt, idx) => {
            const isSelected = value === opt.id;
            const showGroupHeader = opt.group && (idx === 0 || options[idx - 1].group !== opt.group);

            return (
              <React.Fragment key={opt.id}>
                {showGroupHeader && (
                  <div className="px-3 pt-2.5 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-t border-slate-100 mt-1 flex items-center gap-1.5 bg-slate-50/50 select-none">
                    <span>{opt.group}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-xs flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer",
                    isSelected ? "bg-blue-50/70 text-blue-700 font-bold" : "text-slate-700"
                  )}
                >
                  <span>{opt.label}</span>
                  {opt.count !== undefined && opt.count > 0 && (
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md border", opt.badgeClass || "bg-blue-50 text-blue-600 border-blue-100")}>
                      {opt.count}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface PropertyShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  onSuccess?: () => void;
}

export function PropertyShareDialog({
  isOpen,
  onClose,
  leadId,
  onSuccess,
}: PropertyShareDialogProps) {
  const { language, t } = useLanguage();
  const isEn = language === "en";

  // Filter States
  const [query, setQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState<"th" | "en" | "cn" | "ru">(isEn ? "en" : "th");
  const [province, setProvince] = useState<string>("ALL");
  const [propertyType, setPropertyType] = useState<string>("ALL");
  const [listingType, setListingType] = useState<string>("ALL");
  const [sort, setSort] = useState<string>("NEWEST");
  
  const [priceRange, setPriceRange] = useState<string>("ALL");
  const [sizeRange, setSizeRange] = useState<string>("ALL");
  const [bedrooms, setBedrooms] = useState<string>("ALL");
  const [transitStation, setTransitStation] = useState<string>("ALL");

  // Feature Toggles
  const [nearTrain, setNearTrain] = useState(false);
  const [petFriendly, setPetFriendly] = useState(false);
  const [fullyFurnished, setFullyFurnished] = useState(false);
  const [isForeigner, setIsForeigner] = useState(false);
  const [isInvestment, setIsInvestment] = useState(false);
  const [isHotDeal, setIsHotDeal] = useState(false);
  const [allowAirbnb, setAllowAirbnb] = useState(false);

  const [properties, setProperties] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [successProperty, setSuccessProperty] = useState<any | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      // Parse price range
      let minPrice: number | undefined = undefined;
      let maxPrice: number | undefined = undefined;
      if (priceRange !== "ALL") {
        const [min, max] = priceRange.split("-").map(Number);
        if (!isNaN(min) && min > 0) minPrice = min;
        if (!isNaN(max) && max > 0) maxPrice = max;
      }

      // Parse size range
      let minSize: number | undefined = undefined;
      let maxSize: number | undefined = undefined;
      if (sizeRange !== "ALL") {
        const [min, max] = sizeRange.split("-").map(Number);
        if (!isNaN(min) && min > 0) minSize = min;
        if (!isNaN(max) && max > 0) maxSize = max;
      }

      const res = await searchPropertiesAction({
        q: query.trim() || undefined,
        listing_type: listingType !== "ALL" ? listingType : undefined,
        property_type: propertyType !== "ALL" ? propertyType : undefined,
        province: province !== "ALL" ? province : undefined,
        bedrooms: bedrooms !== "ALL" ? bedrooms : undefined,
        min_price: minPrice,
        max_price: maxPrice,
        min_size: minSize,
        max_size: maxSize,
        transit_station: transitStation !== "ALL" ? transitStation : undefined,
        near_train: nearTrain || undefined,
        pet_friendly: petFriendly || undefined,
        fully_furnished: fullyFurnished || undefined,
        is_foreigner: isForeigner || undefined,
        is_hot_deal: isHotDeal || undefined,
        allow_airbnb: allowAirbnb || undefined,
        sort: sort,
        status: ["ACTIVE"],
      });

      if (res.success && res.data) {
        setProperties(res.data.properties || []);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      }
    } catch (err) {
      console.error("Failed to load properties for sharing:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedLang(isEn ? "en" : "th");
    }
  }, [isOpen, isEn]);

  useEffect(() => {
    if (isOpen) {
      fetchProperties();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen, 
    province, 
    propertyType, 
    listingType, 
    sort, 
    priceRange, 
    sizeRange, 
    bedrooms, 
    transitStation,
    nearTrain,
    petFriendly,
    fullyFurnished,
    isForeigner,
    isInvestment,
    isHotDeal,
    allowAirbnb
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProperties();
  };

  const handleShare = async (property: any) => {
    setSendingId(property.id);
    try {
      const res = await sendPropertyCardAction(
        leadId,
        {
          id: property.id,
          code: property.id.slice(0, 8).toUpperCase(),
          title: property.title,
          title_en: property.title_en,
          title_cn: property.title_cn,
          title_ru: property.title_ru,
          project_name: property.project_name,
          project_name_en: property.project_name_en,
          project_name_cn: property.project_name_cn,
          project_name_ru: property.project_name_ru,
          listing_type: property.listing_type,
          property_type: property.property_type,
          price: property.price,
          rental_price: property.rental_price,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          size_sqm: property.size_sqm,
          land_size_sqwah: property.land_size_sqwah,
          popular_area: property.popular_area,
          popular_area_en: property.popular_area_en,
          district: property.district,
          district_en: property.district_en,
          province: property.province,
          province_en: property.province_en,
          images: property.images || (property.cover_image_url ? [property.cover_image_url] : []),
          imageUrl: property.cover_image_url,
          publicUrl: `/properties/${property.id}`,
        },
        selectedLang,
      );
      if (res.success) {
        setSuccessProperty(property);
        setShowSuccessModal(true);

        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"],
          });
        } catch {
          // ignore if canvas not supported
        }

        toast.success(isEn ? "Flex Message shared to chat successfully! ✨" : "แชร์ Flex Message เข้าแชทเรียบร้อยแล้ว! ✨");
        onSuccess?.();

        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessProperty(null);
          onClose();
        }, 1400);
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error((isEn ? "Failed to share property: " : "แชร์ทรัพย์ไม่สำเร็จ: ") + err.message);
    } finally {
      setSendingId(null);
    }
  };

  const clearAllFilters = () => {
    setQuery("");
    setProvince("ALL");
    setPropertyType("ALL");
    setListingType("ALL");
    setSort("NEWEST");
    setPriceRange("ALL");
    setSizeRange("ALL");
    setBedrooms("ALL");
    setTransitStation("ALL");
    setNearTrain(false);
    setPetFriendly(false);
    setFullyFurnished(false);
    setIsForeigner(false);
    setIsInvestment(false);
    setIsHotDeal(false);
    setAllowAirbnb(false);
  };

  const hasActiveFilters = 
    query || 
    province !== "ALL" || 
    propertyType !== "ALL" || 
    listingType !== "ALL" || 
    priceRange !== "ALL" || 
    sizeRange !== "ALL" || 
    bedrooms !== "ALL" || 
    transitStation !== "ALL" ||
    nearTrain ||
    petFriendly ||
    fullyFurnished ||
    isForeigner ||
    isInvestment ||
    isHotDeal ||
    allowAirbnb;

  // Counts helpers
  const saleCount = counts?.listing_type?.SALE || 0;
  const rentCount = counts?.listing_type?.RENT || 0;
  const saleRentCount = counts?.listing_type?.SALE_AND_RENT || 0;
  const totalCount = counts?.total || properties.length;

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title={
        <div className="flex items-center justify-between w-full pr-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEn ? "Share Property to Chat" : "เลือกและแชร์ทรัพย์สินในแชท"}
              </h2>
              <p className="text-xs text-slate-400">
                {isEn ? "Filter active listings and send rich Flex Message cards to the customer" : "ค้นหาและกรองทรัพย์ พร้อมส่งการ์ด Flex Message ให้ลูกค้าได้หลายภาษา"}
              </p>
            </div>
          </div>

          {/* Target Send Language Selector in Header */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 px-1.5 hidden sm:inline">
              🌐 {isEn ? "Lang:" : "ภาษา:"}
            </span>
            <button
              type="button"
              onClick={() => setSelectedLang("th")}
              className={cn(
                "px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                selectedLang === "th"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <span className="fi fi-th h-3 w-4 rounded-xs shadow-2xs shrink-0" />
              <span>{isEn ? "TH" : "ไทย"}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedLang("en")}
              className={cn(
                "px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                selectedLang === "en"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <span className="fi fi-gb h-3 w-4 rounded-xs shadow-2xs shrink-0" />
              <span>EN</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedLang("cn")}
              className={cn(
                "px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                selectedLang === "cn"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <span className="fi fi-cn h-3 w-4 rounded-xs shadow-2xs shrink-0" />
              <span>中文</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedLang("ru")}
              className={cn(
                "px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                selectedLang === "ru"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <span className="fi fi-ru h-3 w-4 rounded-xs shadow-2xs shrink-0" />
              <span>RU</span>
            </button>
          </div>
        </div>
      }
      className="max-w-6xl"
    >
      <div className="p-4 space-y-4 relative min-h-[300px]">
        {/* Animated Success Modal Overlay */}
        <AnimatePresence>
          {showSuccessModal && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 rounded-2xl"
            >
              <m.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: -20 }}
                transition={{ type: "spring", damping: 18, stiffness: 280 }}
                className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 flex flex-col items-center gap-3 relative overflow-hidden"
              >
                {/* Background ambient glow */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

                {/* Animated Icon */}
                <m.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.05 }}
                  className="w-16 h-16 rounded-2xl bg-linear-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30"
                >
                  <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                </m.div>

                <div>
                  <m.h3
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-base font-extrabold text-slate-900"
                  >
                    {isEn ? "Flex Message Sent! ✨" : "แชร์การ์ด Flex สำเร็จ! ✨"}
                  </m.h3>
                  <m.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xs text-slate-500 mt-1"
                  >
                    {isEn
                      ? "The property card was shared to the chat successfully."
                      : "ส่งการ์ดข้อมูลทรัพย์สินเข้าห้องแชทเรียบร้อยแล้ว"}
                  </m.p>
                </div>

                {successProperty && (
                  <m.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 }}
                    className="w-full mt-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                      {successProperty.cover_image_url || successProperty.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={successProperty.cover_image_url || successProperty.images?.[0]}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-5 h-5 text-slate-400 m-auto mt-2.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {successProperty.project_name || successProperty.title}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-extrabold">
                        {successProperty.rental_price
                          ? `฿${Number(successProperty.rental_price).toLocaleString()} /mo`
                          : successProperty.price
                            ? `฿${Number(successProperty.price).toLocaleString()}`
                            : "-"}
                      </p>
                    </div>
                  </m.div>
                )}
              </m.div>
            </m.div>
          )}
        </AnimatePresence>
        {/* =========================================================================
            PROFESSIONAL DUAL-ROW FILTER BAR WITH REAL-TIME COUNTS
           ========================================================================= */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          {/* ROW 1: Search Input (Spacious Flex-1), Province, Property Type, Sort */}
          <div className="flex flex-wrap items-center gap-2.5 relative z-30">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isEn ? "Search location, project name, e.g. Sukhumvit..." : "ค้นหาทำเล, โครงการ, เช่น สุขุมวิท..."}
                className="pl-9.5 pr-22 h-10 rounded-xl bg-slate-50 border-slate-200 text-xs focus:bg-white transition-colors w-full"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-18 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <Button
                type="submit"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (isEn ? "Search" : "ค้นหา")}
              </Button>
            </form>

            {/* Province Dropdown */}
            <FilterDropdown
              value={province}
              onChange={setProvince}
              placeholder={isEn ? "All Provinces" : "ทุกจังหวัด"}
              allLabel={isEn ? "All Provinces" : "ทุกจังหวัด"}
              allCount={counts?.total}
              className="w-[145px] shrink-0"
              options={[
                { id: "กรุงเทพมหานคร", label: isEn ? "Bangkok" : "กรุงเทพฯ", count: counts?.provinces?.["กรุงเทพมหานคร"] || 0, badgeClass: "bg-blue-50 text-blue-600 border-blue-100" },
                { id: "ภูเก็ต", label: isEn ? "Phuket" : "ภูเก็ต", count: counts?.provinces?.["ภูเก็ต"] || 0, badgeClass: "bg-blue-50 text-blue-600 border-blue-100" },
                { id: "ชลบุรี", label: isEn ? "Chonburi / Pattaya" : "ชลบุรี / พัทยา", count: counts?.provinces?.["ชลบุรี"] || 0, badgeClass: "bg-blue-50 text-blue-600 border-blue-100" },
                { id: "เชียงใหม่", label: isEn ? "Chiang Mai" : "เชียงใหม่", count: counts?.provinces?.["เชียงใหม่"] || 0, badgeClass: "bg-blue-50 text-blue-600 border-blue-100" },
                { id: "นนทบุรี", label: isEn ? "Nonthaburi" : "นนทบุรี", count: counts?.provinces?.["นนทบุรี"] || 0, badgeClass: "bg-blue-50 text-blue-600 border-blue-100" },
                { id: "สมุทรปราการ", label: isEn ? "Samut Prakan" : "สมุทรปราการ", count: counts?.provinces?.["สมุทรปราการ"] || 0, badgeClass: "bg-blue-50 text-blue-600 border-blue-100" },
                { id: "ปทุมธานี", label: isEn ? "Pathum Thani" : "ปทุมธานี", count: counts?.provinces?.["ปทุมธานี"] || 0, badgeClass: "bg-blue-50 text-blue-600 border-blue-100" },
              ].filter((p) => p.count > 0)}
            />

            {/* Property Types Dropdown */}
            <FilterDropdown
              value={propertyType}
              onChange={setPropertyType}
              placeholder={isEn ? "All Property Types" : "ทุกประเภททรัพย์"}
              allLabel={isEn ? "All Property Types" : "ทุกประเภททรัพย์"}
              allCount={counts?.total}
              className="w-[165px] shrink-0"
              options={[
                { id: "CONDO", label: isEn ? "Condo" : "คอนโด", count: counts?.property_type?.["CONDO"] || 0, badgeClass: "bg-indigo-50 text-indigo-600 border-indigo-100" },
                { id: "HOUSE", label: isEn ? "Single House" : "บ้านเดี่ยว", count: counts?.property_type?.["HOUSE"] || 0, badgeClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
                { id: "TOWNHOME", label: isEn ? "Townhome" : "ทาวน์โฮม", count: counts?.property_type?.["TOWNHOME"] || 0, badgeClass: "bg-teal-50 text-teal-600 border-teal-100" },
                { id: "VILLA", label: isEn ? "Villa" : "วิลล่า", count: counts?.property_type?.["VILLA"] || 0, badgeClass: "bg-purple-50 text-purple-600 border-purple-100" },
                { id: "POOL_VILLA", label: isEn ? "Pool Villa" : "พูลวิลล่า", count: counts?.property_type?.["POOL_VILLA"] || 0, badgeClass: "bg-cyan-50 text-cyan-600 border-cyan-100" },
                { id: "LAND", label: isEn ? "Land" : "ที่ดิน", count: counts?.property_type?.["LAND"] || 0, badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
                { id: "OFFICE_BUILDING", label: isEn ? "Office" : "ออฟฟิศ", count: counts?.property_type?.["OFFICE_BUILDING"] || 0, badgeClass: "bg-blue-50 text-blue-600 border-blue-100" },
                { id: "COMMERCIAL_BUILDING", label: isEn ? "Commercial" : "อาคารพาณิชย์", count: counts?.property_type?.["COMMERCIAL_BUILDING"] || 0, badgeClass: "bg-rose-50 text-rose-600 border-rose-100" },
                { id: "WAREHOUSE", label: isEn ? "Warehouse" : "โกดัง", count: counts?.property_type?.["WAREHOUSE"] || 0, badgeClass: "bg-slate-100 text-slate-700 border-slate-200" },
              ].filter((pt) => pt.count > 0)}
            />

            {/* Sort Dropdown */}
            <FilterDropdown
              value={sort}
              onChange={setSort}
              placeholder={isEn ? "✨ Newest" : "✨ ล่าสุด"}
              className="w-[130px] shrink-0 ml-auto"
              align="right"
              options={[
                { id: "NEWEST", label: isEn ? "✨ Newest" : "✨ ล่าสุด" },
                { id: "PRICE_ASC", label: isEn ? "💰 Price: Low" : "💰 ราคา: ต่ำ-สูง" },
                { id: "PRICE_DESC", label: isEn ? "💎 Price: High" : "💎 ราคา: สูง-ต่ำ" },
              ]}
            />
          </div>

          {/* ROW 2: Deal Types, Prices, Sizes, Bedrooms with Counts, Stations, Quick Tag Badges, Reset */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 relative z-10">
            {/* Deal Type Switcher with Colorful Counts */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setListingType("ALL")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  listingType === "ALL"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span>{isEn ? "All" : "ทั้งหมด"}</span>
                {counts?.total > 0 && (
                  <span className={cn(
                    "text-[10px] font-extrabold px-1.5 py-0.2 rounded-full",
                    listingType === "ALL" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  )}>
                    {counts.total}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setListingType("SALE")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  listingType === "SALE"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span>{isEn ? "Buy" : "ขาย"}</span>
                {saleCount > 0 && (
                  <span className={cn(
                    "text-[10px] font-extrabold px-1.5 py-0.2 rounded-full",
                    listingType === "SALE" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                  )}>
                    {saleCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setListingType("RENT")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  listingType === "RENT"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span>{isEn ? "Rent" : "เช่า"}</span>
                {rentCount > 0 && (
                  <span className={cn(
                    "text-[10px] font-extrabold px-1.5 py-0.2 rounded-full",
                    listingType === "RENT" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
                  )}>
                    {rentCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setListingType("SALE_AND_RENT")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  listingType === "SALE_AND_RENT"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span>{isEn ? "Rent/Buy" : "ขาย/เช่า"}</span>
                {saleRentCount > 0 && (
                  <span className={cn(
                    "text-[10px] font-extrabold px-1.5 py-0.2 rounded-full",
                    listingType === "SALE_AND_RENT" ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700"
                  )}>
                    {saleRentCount}
                  </span>
                )}
              </button>
            </div>

            {/* Price Range Dropdown with Colorful Counts */}
            <FilterDropdown
              value={priceRange}
              onChange={setPriceRange}
              placeholder={isEn ? "All Prices" : "ทุกช่วงราคา"}
              allLabel={isEn ? "All Prices" : "ทุกช่วงราคา"}
              allCount={counts?.total}
              className="w-[140px] shrink-0"
              buttonHeight="h-9"
              options={[
                { id: "0-3000000", label: isEn ? "< ฿3M" : "< ฿3 ล้าน", count: counts?.prices?.["0-3000000"] || 0, badgeClass: "bg-emerald-50 text-emerald-600 border-emerald-100", group: isEn ? "🏷️ For Sale" : "🏷️ ราคาขาย" },
                { id: "3000000-5000000", label: isEn ? "฿3M - ฿5M" : "฿3 - 5 ล้าน", count: counts?.prices?.["3000000-5000000"] || 0, badgeClass: "bg-emerald-50 text-emerald-600 border-emerald-100", group: isEn ? "🏷️ For Sale" : "🏷️ ราคาขาย" },
                { id: "5000000-10000000", label: isEn ? "฿5M - ฿10M" : "฿5 - 10 ล้าน", count: counts?.prices?.["5000000-10000000"] || 0, badgeClass: "bg-emerald-50 text-emerald-600 border-emerald-100", group: isEn ? "🏷️ For Sale" : "🏷️ ราคาขาย" },
                { id: "10000000-20000000", label: isEn ? "฿10M - ฿20M" : "฿10 - 20 ล้าน", count: counts?.prices?.["10000000-20000000"] || 0, badgeClass: "bg-emerald-50 text-emerald-600 border-emerald-100", group: isEn ? "🏷️ For Sale" : "🏷️ ราคาขาย" },
                { id: "20000000-999999999", label: isEn ? "฿20M+" : "฿20 ล้าน+", count: counts?.prices?.["20000000-999999999"] || 0, badgeClass: "bg-emerald-50 text-emerald-600 border-emerald-100", group: isEn ? "🏷️ For Sale" : "🏷️ ราคาขาย" },
                { id: "0-15000", label: isEn ? "< ฿15k/mo" : "< ฿15,000/ด.", count: counts?.prices?.["0-15000"] || 0, badgeClass: "bg-teal-50 text-teal-600 border-teal-100", group: isEn ? "🔑 For Rent" : "🔑 ราคาเช่า" },
                { id: "15000-30000", label: isEn ? "฿15k - ฿30k/mo" : "฿15k - 30k/ด.", count: counts?.prices?.["15000-30000"] || 0, badgeClass: "bg-teal-50 text-teal-600 border-teal-100", group: isEn ? "🔑 For Rent" : "🔑 ราคาเช่า" },
                { id: "30000-60000", label: isEn ? "฿30k - ฿60k/mo" : "฿30k - 60k/ด.", count: counts?.prices?.["30000-60000"] || 0, badgeClass: "bg-teal-50 text-teal-600 border-teal-100", group: isEn ? "🔑 For Rent" : "🔑 ราคาเช่า" },
                { id: "60000-999999999", label: isEn ? "฿60k+/mo" : "฿60k+/ด.", count: counts?.prices?.["60000-999999999"] || 0, badgeClass: "bg-teal-50 text-teal-600 border-teal-100", group: isEn ? "🔑 For Rent" : "🔑 ราคาเช่า" },
              ].filter((pr) => pr.count > 0)}
            />

            {/* Size Range Dropdown with Colorful Counts */}
            <FilterDropdown
              value={sizeRange}
              onChange={setSizeRange}
              placeholder={isEn ? "All Sizes" : "ทุกขนาดพื้นที่"}
              allLabel={isEn ? "All Sizes" : "ทุกขนาด"}
              allCount={counts?.total}
              className="w-[135px] shrink-0"
              buttonHeight="h-9"
              options={[
                { id: "0-35", label: isEn ? "< 35 sq.m." : "< 35 ตร.ม.", count: counts?.sizes?.["0-35"] || 0, badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
                { id: "35-50", label: isEn ? "35 - 50 sq.m." : "35 - 50 ตร.ม.", count: counts?.sizes?.["35-50"] || 0, badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
                { id: "50-80", label: isEn ? "50 - 80 sq.m." : "50 - 80 ตร.ม.", count: counts?.sizes?.["50-80"] || 0, badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
                { id: "80-120", label: isEn ? "80 - 120 sq.m." : "80 - 120 ตร.ม.", count: counts?.sizes?.["80-120"] || 0, badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
                { id: "120-999999", label: isEn ? "120+ sq.m." : "120+ ตร.ม.", count: counts?.sizes?.["120-999999"] || 0, badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
              ].filter((sr) => sr.count > 0)}
            />

            {/* Bedrooms Segmented Group with Counts */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200 shrink-0">
              <span className="text-[11px] font-bold text-slate-500 mr-1">
                {isEn ? "Bedrooms" : "ห้องนอน"}
              </span>
              {["ALL", "1", "2", "3", "4+"].map((b) => {
                const bCount = b === "ALL" ? counts?.total : counts?.bedrooms?.[b] || 0;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBedrooms(b)}
                    className={cn(
                      "px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      bedrooms === b
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200/60"
                    )}
                  >
                    <span>{b === "ALL" ? (isEn ? "All" : "ทั้งหมด") : b}</span>
                    {bCount !== null && bCount > 0 && (
                      <span
                        className={cn(
                          "text-[10px] font-extrabold px-1.5 py-0.2 rounded-full",
                          bedrooms === b ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
                        )}
                      >
                        {bCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Searchable Transit Stations Selector */}
            <StationSearchSelect
              transitStation={transitStation === "ALL" ? "" : transitStation}
              setTransitStation={(v) => setTransitStation(v || "ALL")}
              availableStations={counts?.availableStations || []}
              t={t}
              language={selectedLang || (isEn ? "en" : "th")}
              getLocaleValue={getLocaleValue}
              align="end"
              className="w-[165px] h-9"
            />

            {/* Quick Feature Buttons (Icon Badges with Top-Right Green Counters) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Near Train */}
              <button
                type="button"
                onClick={() => setNearTrain(!nearTrain)}
                className={cn(
                  "p-2 rounded-xl border transition-all cursor-pointer relative shadow-2xs",
                  nearTrain
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-slate-200 text-blue-600 hover:bg-blue-50"
                )}
                title={isEn ? "Near Transit" : "ใกล้รถไฟฟ้า"}
              >
                <Train className="w-3.5 h-3.5" />
                {counts?.quick?.nearTrain > 0 && !nearTrain && (
                  <span className="absolute -top-1 -right-1 text-[8.5px] font-extrabold bg-emerald-500 text-white px-1 h-3.5 min-w-[14px] rounded-full shadow-xs flex items-center justify-center">
                    {counts.quick.nearTrain}
                  </span>
                )}
              </button>

              {/* Pet Friendly */}
              <button
                type="button"
                onClick={() => setPetFriendly(!petFriendly)}
                className={cn(
                  "p-2 rounded-xl border transition-all cursor-pointer relative shadow-2xs",
                  petFriendly
                    ? "bg-orange-500 border-orange-500 text-white"
                    : "bg-white border-slate-200 text-orange-600 hover:bg-orange-50"
                )}
                title={isEn ? "Pet Friendly" : "เลี้ยงสัตว์ได้"}
              >
                <PawPrint className="w-3.5 h-3.5" />
                {counts?.quick?.petFriendly > 0 && !petFriendly && (
                  <span className="absolute -top-1 -right-1 text-[8.5px] font-extrabold bg-emerald-500 text-white px-1 h-3.5 min-w-[14px] rounded-full shadow-xs flex items-center justify-center">
                    {counts.quick.petFriendly}
                  </span>
                )}
              </button>

              {/* Fully Furnished */}
              <button
                type="button"
                onClick={() => setFullyFurnished(!fullyFurnished)}
                className={cn(
                  "p-2 rounded-xl border transition-all cursor-pointer relative shadow-2xs",
                  fullyFurnished
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-white border-slate-200 text-emerald-600 hover:bg-emerald-50"
                )}
                title={isEn ? "Fully Furnished" : "แต่งครบพร้อมอยู่"}
              >
                <Armchair className="w-3.5 h-3.5" />
                {counts?.quick?.fullyFurnished > 0 && !fullyFurnished && (
                  <span className="absolute -top-1 -right-1 text-[8.5px] font-extrabold bg-emerald-500 text-white px-1 h-3.5 min-w-[14px] rounded-full shadow-xs flex items-center justify-center">
                    {counts.quick.fullyFurnished}
                  </span>
                )}
              </button>

              {/* Foreigner Quota */}
              <button
                type="button"
                onClick={() => setIsForeigner(!isForeigner)}
                className={cn(
                  "p-2 rounded-xl border transition-all cursor-pointer relative shadow-2xs",
                  isForeigner
                    ? "bg-purple-600 border-purple-600 text-white"
                    : "bg-white border-slate-200 text-purple-600 hover:bg-purple-50"
                )}
                title={isEn ? "Foreigner Quota" : "โควต้าต่างชาติ"}
              >
                <Globe className="w-3.5 h-3.5" />
                {counts?.quick?.isForeigner > 0 && !isForeigner && (
                  <span className="absolute -top-1 -right-1 text-[8.5px] font-extrabold bg-emerald-500 text-white px-1 h-3.5 min-w-[14px] rounded-full shadow-xs flex items-center justify-center">
                    {counts.quick.isForeigner}
                  </span>
                )}
              </button>

              {/* Investment / Commercial */}
              <button
                type="button"
                onClick={() => setIsInvestment(!isInvestment)}
                className={cn(
                  "p-2 rounded-xl border transition-all cursor-pointer relative shadow-2xs",
                  isInvestment
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-slate-200 text-indigo-600 hover:bg-indigo-50"
                )}
                title={isEn ? "Commercial / Investment" : "เพื่อการลงทุน / เชิงพาณิชย์"}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                {counts?.quick?.isInvestment > 0 && !isInvestment && (
                  <span className="absolute -top-1 -right-1 text-[8.5px] font-extrabold bg-emerald-500 text-white px-1 h-3.5 min-w-[14px] rounded-full shadow-xs flex items-center justify-center">
                    {counts.quick.isInvestment}
                  </span>
                )}
              </button>

              {/* Hot Deal */}
              <button
                type="button"
                onClick={() => setIsHotDeal(!isHotDeal)}
                className={cn(
                  "p-2 rounded-xl border transition-all cursor-pointer relative shadow-2xs",
                  isHotDeal
                    ? "bg-rose-600 border-rose-600 text-white"
                    : "bg-white border-slate-200 text-rose-600 hover:bg-rose-50"
                )}
                title={isEn ? "Hot Deal / Reduced" : "ราคาพิเศษ / Hot Deal"}
              >
                <Flame className="w-3.5 h-3.5" />
                {counts?.quick?.isHotDeal > 0 && !isHotDeal && (
                  <span className="absolute -top-1 -right-1 text-[8.5px] font-extrabold bg-emerald-500 text-white px-1 h-3.5 min-w-[14px] rounded-full shadow-xs flex items-center justify-center">
                    {counts.quick.isHotDeal}
                  </span>
                )}
              </button>

              {/* Airbnb Friendly */}
              <button
                type="button"
                onClick={() => setAllowAirbnb(!allowAirbnb)}
                className={cn(
                  "p-2 rounded-xl border transition-all cursor-pointer relative shadow-2xs",
                  allowAirbnb
                    ? "bg-rose-500 border-rose-500 text-white"
                    : "bg-white border-slate-200 text-rose-500 hover:bg-rose-50"
                )}
                title={isEn ? "Airbnb Friendly" : "ปล่อยเช่ารายวันได้"}
              >
                <Building className="w-3.5 h-3.5" />
                {counts?.quick?.allowAirbnb > 0 && !allowAirbnb && (
                  <span className="absolute -top-1 -right-1 text-[8.5px] font-extrabold bg-emerald-500 text-white px-1 h-3.5 min-w-[14px] rounded-full shadow-xs flex items-center justify-center">
                    {counts.quick.allowAirbnb}
                  </span>
                )}
              </button>
            </div>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="ml-auto text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isEn ? "Reset Filters" : "ล้างตัวกรอง"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Count & Grid */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-500 font-medium">
            <span>
              {isEn ? `Found ${properties.length} active listings matching filters` : `พบทั้งหมด ${properties.length} รายการที่ตรงกับเงื่อนไข`}
            </span>
          </div>

          <div className="max-h-[50vh] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-xs font-semibold uppercase tracking-wider">{isEn ? "Searching listings..." : "กำลังค้นหาทรัพย์สิน..."}</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="py-20 text-center text-slate-400 space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-300">
                  <Building2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-600">{isEn ? "No properties match your filters" : "ไม่พบทรัพย์สินที่ตรงกับตัวกรอง"}</p>
                <p className="text-xs">{isEn ? "Try changing deal type, price or keywords" : "ลองเปลี่ยนตัวกรองประเภทดีล หรือคำค้นหาอื่น"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {properties.map((p) => {
                  const cardLang = selectedLang || (isEn ? "en" : "th");
                  const isSaleRent = p.listing_type === "SALE_RENT" || p.listing_type === "SALE_AND_RENT";
                  const isRent = p.listing_type === "RENT";
                  const isSale = p.listing_type === "SALE";

                  const propTypeEmojiMap: Record<string, string> = {
                    HOUSE: "🏡",
                    CONDO: "🏢",
                    TOWNHOME: "🏘️",
                    VILLA: "🏰",
                    POOL_VILLA: "🏊",
                    LAND: "🏞️",
                    OFFICE_BUILDING: "🏬",
                    COMMERCIAL_BUILDING: "🏪",
                    WAREHOUSE: "🏭",
                  };
                  const propEmoji = propTypeEmojiMap[p.property_type] || "🏠";

                  // Bilingual project name for Thai: 🏡 เซนโทร บางนา (Centro Bangna)
                  let displayHeadline = "";
                  const thProject = p.project_name?.trim();
                  const enProject = p.project_name_en?.trim();
                  const thTitle = p.title?.trim();
                  const enTitle = p.title_en?.trim();

                  if (cardLang === "th") {
                    if (thProject) {
                      displayHeadline = enProject && enProject.toLowerCase() !== thProject.toLowerCase()
                        ? `${thProject} (${enProject})`
                        : thProject;
                    } else if (thTitle) {
                      displayHeadline = enTitle && enTitle.toLowerCase() !== thTitle.toLowerCase()
                        ? `${thTitle} (${enTitle})`
                        : thTitle;
                    } else {
                      displayHeadline = enProject || enTitle || "-";
                    }
                  } else if (cardLang === "en") {
                    displayHeadline = enProject || enTitle || thProject || thTitle || "-";
                  } else if (cardLang === "cn") {
                    displayHeadline = p.project_name_cn || p.title_cn || enProject || thProject || "-";
                  } else {
                    displayHeadline = p.project_name_ru || p.title_ru || enProject || thProject || "-";
                  }

                  const rawArea = (cardLang === "en" ? (p.popular_area_en || p.popular_area) : p.popular_area) || "";
                  const rawProv = (cardLang === "en" ? (p.province_en || p.province) : p.province) || "";

                  const area = translateLocation(rawArea, cardLang);
                  const prov = translateLocation(rawProv, cardLang);
                  const locationText = [area, prov].filter(Boolean).join(", ");

                  const propTypeMap: Record<string, Record<string, string>> = {
                    HOUSE: { th: "บ้านเดี่ยว", en: "Single House", cn: "独栋别墅", ru: "Дом" },
                    CONDO: { th: "คอนโด", en: "Condo", cn: "公寓", ru: "Кондо" },
                    TOWNHOME: { th: "ทาวน์โฮม", en: "Townhome", cn: "联排别墅", ru: "Таунхаус" },
                    VILLA: { th: "วิลล่า", en: "Villa", cn: "别墅", ru: "Вилла" },
                    POOL_VILLA: { th: "พูลวิลล่า", en: "Pool Villa", cn: "泳池别墅", ru: "Вилла с бассейном" },
                    LAND: { th: "ที่ดิน", en: "Land", cn: "土地", ru: "Земля" },
                    OFFICE_BUILDING: { th: "ออฟฟิศ", en: "Office", cn: "写字楼", ru: "Офис" },
                    COMMERCIAL_BUILDING: { th: "อาคารพาณิชย์", en: "Commercial", cn: "商铺", ru: "Коммерческая недвижимость" },
                    WAREHOUSE: { th: "โกดัง", en: "Warehouse", cn: "仓库", ru: "Склад" },
                  };
                  const propTypeLabel = propTypeMap[p.property_type]?.[cardLang] || propTypeMap[p.property_type]?.th || p.property_type;

                  const dealTypeBadge = isRent
                    ? (cardLang === "th" ? "เช่า" : cardLang === "cn" ? "出租" : cardLang === "ru" ? "АРЕНДА" : "RENT")
                    : isSale
                      ? (cardLang === "th" ? "ขาย" : cardLang === "cn" ? "出售" : cardLang === "ru" ? "ПРОДАЖА" : "SALE")
                      : (cardLang === "th" ? "ขาย/เช่า" : cardLang === "cn" ? "租售" : cardLang === "ru" ? "ПРОДАЖА/АРЕНДА" : "SALE/RENT");

                  const rentSuffix = cardLang === "th" ? "/ด." : cardLang === "cn" ? "/月" : cardLang === "ru" ? "/мес." : "/mo";
                  const contactPriceText = cardLang === "th" ? "สอบถามราคา" : cardLang === "cn" ? "欢迎垂询价格" : cardLang === "ru" ? "Цена по запросу" : "Contact for price";
                  const shareButtonText = isEn ? "Send Flex Card" : "ส่งการ์ด Flex";

                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="flex gap-3.5 min-w-0">
                        {/* Property Image (2x2 preview if available) */}
                        <div className="w-28 h-28 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100 relative">
                          {p.images && p.images.length >= 4 ? (
                            <div className="grid grid-cols-2 h-full w-full gap-0.5">
                              {p.images.slice(0, 4).map((imgUrl: string, imgIdx: number) => (
                                <div key={imgIdx} className="h-full w-full bg-slate-200 overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          ) : p.cover_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.cover_image_url}
                              alt={p.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Building2 className="w-8 h-8" />
                            </div>
                          )}
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-bold text-white uppercase tracking-wider">
                            {p.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>

                        {/* Property Info */}
                        <div className="min-w-0 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className={cn(
                                "text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md",
                                isRent ? "bg-blue-100 text-blue-700" :
                                isSale ? "bg-emerald-100 text-emerald-700" :
                                "bg-amber-100 text-amber-700"
                              )}>
                                {dealTypeBadge}
                              </span>
                              {propTypeLabel && (
                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                  • {propTypeLabel}
                                </span>
                              )}
                            </div>

                            {/* Main Headline: Prominent Colored Project Name (or Title fallback) with Emoji */}
                            <h4 className="font-extrabold text-sm text-blue-900 group-hover:text-blue-600 line-clamp-1 leading-snug transition-colors">
                              {`${propEmoji} ${displayHeadline}`}
                            </h4>
                          </div>

                          <div className="space-y-1 mt-1">
                            {locationText && (
                              <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{locationText}</span>
                              </p>
                            )}

                            {(p.bedrooms || p.bathrooms || p.size_sqm) && (
                              <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-2">
                                {p.bedrooms && (
                                  <span>
                                    🛏️ {p.bedrooms} {cardLang === "th" ? "ห้องนอน" : cardLang === "cn" ? "卧" : cardLang === "ru" ? "спальн." : "Bed" + (p.bedrooms > 1 ? "s" : "")}
                                  </span>
                                )}
                                {p.bathrooms && (
                                  <span>
                                    🚿 {p.bathrooms} {cardLang === "th" ? "ห้องน้ำ" : cardLang === "cn" ? "卫" : cardLang === "ru" ? "сануз." : "Bath" + (p.bathrooms > 1 ? "s" : "")}
                                  </span>
                                )}
                                {p.size_sqm && (
                                  <span>
                                    📐 {p.size_sqm} {cardLang === "th" ? "ตร.ม." : cardLang === "cn" ? "平方米" : cardLang === "ru" ? "кв.м." : "sq.m."}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Price + Send Button */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-1">
                        <div>
                          {isSaleRent ? (
                            <div className="flex flex-col text-left">
                              {p.price && <span className="text-xs font-extrabold text-emerald-600">฿{Number(p.price).toLocaleString()}</span>}
                              {p.rental_price && <span className="text-[11px] font-extrabold text-blue-600">฿{Number(p.rental_price).toLocaleString()}{rentSuffix}</span>}
                            </div>
                          ) : isRent && p.rental_price ? (
                            <span className="text-sm font-extrabold text-blue-600">
                              ฿{Number(p.rental_price).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{rentSuffix}</span>
                            </span>
                          ) : isSale && p.price ? (
                            <span className="text-sm font-extrabold text-emerald-600">
                              ฿{Number(p.price).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">{contactPriceText}</span>
                          )}
                        </div>

                        <Button
                          onClick={() => handleShare(p)}
                          disabled={sendingId === p.id}
                          size="sm"
                          className="h-8.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5 px-4 shadow-xs active:scale-95 cursor-pointer"
                        >
                          {sendingId === p.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          {shareButtonText}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
