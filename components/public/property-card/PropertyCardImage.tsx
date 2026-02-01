"use client";

import Image from "next/image";
import { Heart, PawPrint } from "lucide-react";
import { IoShieldCheckmark } from "react-icons/io5";
import { getTypeLabel, getListingBadge } from "@/lib/property-utils";
import type { PropertyCardProps } from "../PropertyCard";

interface PropertyCardImageProps {
  property: PropertyCardProps;
  priority?: boolean;
  isFavorite: boolean;
  isAnimating: boolean;
  onFavoriteClick: (e: React.MouseEvent) => void;
  comparisonBadges: { label: string; color: string }[];
  areaProvince: string;
}

export function PropertyCardImage({
  property,
  priority = false,
  isFavorite,
  isAnimating,
  onFavoriteClick,
  comparisonBadges,
  areaProvince,
}: PropertyCardImageProps) {
  const badge = getListingBadge(property.listing_type);

  return (
    <div className="relative aspect-4/3 sm:aspect-4/3 md:aspect-square h-auto sm:h-auto md:h-[300px] w-full overflow-hidden rounded-t-2xl sm:rounded-t-2xl md:rounded-t-3xl bg-slate-200 group-hover:after:bg-black/5">
      {property.image_url ? (
        <Image
          src={property.image_url}
          alt={`${
            property.listing_type === "SALE"
              ? "ขาย"
              : property.listing_type === "RENT"
                ? "เช่า"
                : "ขาย-เช่า"
          }${getTypeLabel(property.property_type)} - ${property.title}${
            areaProvince ? ` ทำเล${areaProvince}` : ""
          }`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover object-top transform-gpu will-change-transform group-hover:scale-125 group:hover:object-contain transition-transform duration-1000"
          priority={priority}
          loading={priority ? "eager" : "lazy"}
        />
      ) : (
        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
          ไม่มีรูปภาพ
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 rounded-t-2xl md:rounded-t-3xl bg-linear-to-t from-black/50 via-transparent to-transparent" />

      {/* Badge Overlay Container */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-20">
        {/* Verified Badge */}
        {property.verified && (
          <div className="group/verified flex items-center bg-blue-600/90 backdrop-blur-md text-white p-1.5 rounded-full shadow-lg transition-all duration-300 hover:pr-3 cursor-default">
            <IoShieldCheckmark className="w-5 h-5" />
            <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-[10px] font-bold transition-all duration-300 group-hover/verified:max-w-[100px] group-hover/verified:opacity-100 group-hover/verified:ml-1.5">
              VERIFIED
            </span>
          </div>
        )}

        {/* Comparison Badges */}
        {comparisonBadges.map((b, idx) => (
          <div
            key={idx}
            className={`flex items-center px-2 py-1 rounded-md shadow-sm border border-white/20 text-[10px] font-bold ${b.color} backdrop-blur-md`}
          >
            {b.label}
          </div>
        ))}
      </div>

      {property.meta_keywords?.includes("Pet Friendly") && (
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-orange-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm z-20">
          <PawPrint className="w-5 h-5" />
          <span>Pet Friendly</span>
        </div>
      )}

      {/* Favorite Button */}
      <button
        onClick={onFavoriteClick}
        className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${
          isFavorite
            ? "bg-red-500 text-white"
            : "bg-white/40 text-[#1B263B] hover:bg-red-500 hover:text-white"
        } ${isAnimating ? "scale-125" : "scale-100"}`}
      >
        <Heart
          className={`h-4 w-4 transition-all duration-500 ${
            isFavorite ? "fill-current scale-110" : "scale-100"
          } ${isAnimating ? "animate-pulse" : ""}`}
          style={{
            transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      </button>

      {badge && (
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md border border-white/30 text-[#12213b] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          {badge.label}
        </div>
      )}
    </div>
  );
}
