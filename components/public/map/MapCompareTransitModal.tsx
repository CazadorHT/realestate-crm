"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  ExternalLink,
  BedDouble,
  Bath,
  Maximize2,
  CheckCircle2,
  Zap,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { FaPersonWalking, FaCarSide } from "react-icons/fa6";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { SlimMapPin } from "@/lib/services/map-pins";
import {
  getPinProjectOrPropertyHeadline,
  getTransitLogo,
  getTransitTypeLabel,
  computeTransitTravelInfo,
  formatCompactPillAmount,
} from "./map-price-utils";
import { getEffectivePrice } from "@/lib/property-hardened-utils";
import { formatPrice } from "@/lib/property-utils";
import { cn } from "@/lib/utils";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800&auto=format&fit=crop";

interface MapCompareTransitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pins: SlimMapPin[];
  compareIds: string[];
  language: string;
  langPrefix: string;
  onRemoveId: (id: string) => void;
}

export function MapCompareTransitModal({
  open,
  onOpenChange,
  pins,
  compareIds,
  language,
  langPrefix,
  onRemoveId,
}: MapCompareTransitModalProps) {
  const selectedPins = useMemo(() => {
    const pinMap = new Map<string, SlimMapPin>();
    for (const p of pins) {
      pinMap.set(p.id, p);
    }
    return compareIds
      .map((id) => pinMap.get(id))
      .filter((p): p is SlimMapPin => Boolean(p));
  }, [compareIds, pins]);

  // Find minimum transit distance to identify the winner
  const minTransitDistance = useMemo(() => {
    let min = Infinity;
    for (const p of selectedPins) {
      if (typeof p.transit_distance_meters === "number" && p.transit_distance_meters > 0) {
        if (p.transit_distance_meters < min) {
          min = p.transit_distance_meters;
        }
      }
    }
    return min < Infinity ? min : null;
  }, [selectedPins]);

  const modalTitle =
    language === "th"
      ? "เปรียบเทียบระยะทางรถไฟฟ้า & ความคุ้มค่า"
      : language === "cn"
        ? "对比地铁距离与性价比"
        : language === "ru"
          ? "Сравнение близости к метро"
          : "Transit Proximity & Value Comparison";

  const modalSubtitle =
    language === "th"
      ? "เทียบระยะเดินขึ้นรถไฟฟ้า ราคาเริ่มต้น และขนาดห้องระหว่างโครงการที่คุณเลือก"
      : language === "cn"
        ? "直观对比所选楼盘的步行到站距离、起始租售价与户型大小"
        : language === "ru"
          ? "Сравните расстояние до метро пешком, цены и площади выбранных проектов"
          : "Compare walking distances to transit stations, pricing, and room layouts side-by-side";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 fill-blue-600" />
            </span>
            <div>
              <DialogTitle className="text-base sm:text-lg font-extrabold text-slate-900">
                {modalTitle}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {modalSubtitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Comparison Cards Grid */}
        <div
          className={cn(
            "grid gap-3 sm:gap-4",
            selectedPins.length === 2
              ? "grid-cols-1 sm:grid-cols-2"
              : selectedPins.length === 3
                ? "grid-cols-1 sm:grid-cols-3"
                : "grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
          )}
        >
          {selectedPins.map((pin) => {
            const { primaryTitle, secondarySubtitle } =
              getPinProjectOrPropertyHeadline(pin, language);
            const prices = getEffectivePrice(pin);
            const isClosest =
              minTransitDistance !== null &&
              pin.transit_distance_meters === minTransitDistance &&
              selectedPins.length > 1;

            const travelInfo = computeTransitTravelInfo({
              distanceMeters: pin.transit_distance_meters ?? null,
              language,
            });

            const transitType = pin.transit_type || "BTS";
            const stationName =
              (language === "en" && pin.transit_station_name_en) ||
              pin.transit_station_name ||
              null;

            const coverSrc = pin.image_url || pin.project_image_url || FALLBACK_IMG;
            const detailHref = `${langPrefix || ""}/properties/${pin.slug || pin.id}`;

            return (
              <div
                key={pin.id}
                className={cn(
                  "relative rounded-2xl border p-3 flex flex-col justify-between transition-all duration-200 bg-white",
                  isClosest
                    ? "border-emerald-400 ring-2 ring-emerald-400/20 shadow-md bg-emerald-50/20"
                    : "border-slate-200 shadow-2xs hover:border-slate-300"
                )}
              >
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => onRemoveId(pin.id)}
                  className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center cursor-pointer transition-colors"
                  title="ลบออก"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Top: Image & Badge */}
                <div>
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 mb-2.5">
                    <Image
                      src={coverSrc}
                      alt={primaryTitle}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 240px"
                    />

                    {isClosest && (
                      <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                        <Sparkles className="w-3 h-3 fill-white" />
                        <span>
                          {language === "th"
                            ? "ใกล้รถไฟฟ้าที่สุด"
                            : language === "cn"
                              ? "距离最近"
                              : "Closest to transit"}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Title & Subtitle */}
                  <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1 leading-tight">
                    {primaryTitle}
                  </h4>
                  {secondarySubtitle && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                      {secondarySubtitle}
                    </p>
                  )}

                  {/* TRANSIT CARD SECTION (Key comparison value) */}
                  <div
                    className={cn(
                      "mt-2 p-2.5 rounded-xl border flex flex-col gap-1.5",
                      isClosest
                        ? "bg-emerald-50/80 border-emerald-200"
                        : "bg-slate-50 border-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                        <Image
                          src={getTransitLogo(transitType)}
                          alt={transitType}
                          width={16}
                          height={16}
                          className="object-contain"
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {stationName
                          ? `${getTransitTypeLabel(transitType)} ${stationName}`
                          : getTransitTypeLabel(transitType)}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-0.5">
                      <div className="flex items-center gap-1 text-slate-700 font-bold text-sm">
                        {travelInfo.isWalk ? (
                          <FaPersonWalking className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <FaCarSide className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        )}
                        <span>
                          {travelInfo.summaryLabel ||
                            (pin.transit_distance_meters
                              ? `${pin.transit_distance_meters} ม.`
                              : "-")}
                        </span>
                      </div>

                      {typeof pin.transit_distance_meters === "number" && (
                        <span className="text-[11px] font-semibold text-slate-500">
                          {pin.transit_distance_meters} ม.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="mt-3 py-2 border-y border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">
                        {language === "th" ? "ราคาขาย:" : "Sale Price:"}
                      </span>
                      <span className="font-extrabold text-blue-600">
                        {prices.salePrice > 0
                          ? formatPrice(prices.salePrice, language)
                          : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">
                        {language === "th" ? "ราคาเช่า:" : "Rent Price:"}
                      </span>
                      <span className="font-extrabold text-amber-600">
                        {prices.rentalPrice > 0
                          ? `${formatPrice(prices.rentalPrice, language)}/ด.`
                          : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Room Specs */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 px-1">
                    {pin.bedrooms != null && (
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-3 h-3 text-slate-400" />
                        <span>{pin.bedrooms} นอน</span>
                      </span>
                    )}
                    {pin.bathrooms != null && (
                      <span className="flex items-center gap-1">
                        <Bath className="w-3 h-3 text-slate-400" />
                        <span>{pin.bathrooms} น้ำ</span>
                      </span>
                    )}
                    {pin.size_sqm != null && (
                      <span className="flex items-center gap-1">
                        <Maximize2 className="w-3 h-3 text-slate-400" />
                        <span>{pin.size_sqm} ตร.ม.</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom CTA */}
                <Link
                  href={detailHref}
                  target="_blank"
                  className="mt-3.5 w-full inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>{language === "th" ? "ดูห้องนี้" : "View Unit"}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Footer Full Compare Link */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            {language === "th"
              ? "ต้องการเทียบสิ่งอำนวยความสะดวก นโยบายสัตว์เลี้ยง และสเปกครบทุกมิติ?"
              : "Need in-depth specs, pet policy, and full amenity comparison?"}
          </p>

          <Link
            href={`${langPrefix || ""}/compare?ids=${compareIds.join(",")}`}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors"
          >
            <span>
              {language === "th"
                ? "เปิดตารางเปรียบเทียบเต็ม 20+ มิติ"
                : "Open Full 20+ Specs Table"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
