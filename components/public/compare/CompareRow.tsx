"use client";

import { ShieldCheck, MapPin, Check } from "lucide-react";
import { CompareProperty, ComparisonRow } from "./types";
import { formatMoney, cleanListingType, isPetFriendly } from "./utils";

interface CompareRowProps {
  row: ComparisonRow;
  properties: CompareProperty[];
  idx: number;
}

export function CompareRow({ row, properties, idx }: CompareRowProps) {
  // Calculation for max value to highlight Winner
  const isNumericCompare = [
    "property_size",
    "bedrooms",
    "bathrooms",
    "parking_slots",
  ].includes(row.key);

  let maxValue = -1;
  if (isNumericCompare) {
    maxValue = Math.max(
      ...properties.map((p) => {
        if (row.key === "property_size") return p.size_sqm || 0;
        if (row.key === "bedrooms") return p.bedrooms || 0;
        if (row.key === "bathrooms") return p.bathrooms || 0;
        if (row.key === "parking_slots") return p.parking_slots || 0;
        return 0;
      }),
    );
  }

  const renderPriceCell = (p: CompareProperty) => {
    const salePrice = p.price || p.original_price;
    const rentPrice = p.rental_price || p.original_rental_price;

    const showSale = !!salePrice;
    const showRent = !!rentPrice;

    const saleContent =
      showSale && salePrice ? (
        <div className="block mb-1">
          {p.price && p.original_price && p.original_price > p.price && (
            <span className="text-[10px] md:text-xs text-slate-400 line-through mr-1 md:mr-2 block sm:inline">
              {formatMoney(p.original_price)}
            </span>
          )}
          <span className="text-blue-600 font-bold text-sm md:text-base">
            {formatMoney(salePrice)}
          </span>
        </div>
      ) : null;

    const rentContent =
      showRent && rentPrice ? (
        <div className="block">
          {p.rental_price &&
            p.original_rental_price &&
            p.original_rental_price > p.rental_price && (
              <span className="text-[10px] md:text-xs text-slate-400 line-through mr-1 md:mr-2 block sm:inline">
                {formatMoney(p.original_rental_price)}/ด
              </span>
            )}
          <span className="text-orange-600 font-bold text-sm md:text-base">
            {formatMoney(rentPrice)}/ด
          </span>
        </div>
      ) : null;

    if (!saleContent && !rentContent)
      return <span className="text-slate-400">-</span>;

    return (
      <div className="flex flex-col">
        {saleContent}
        {rentContent}
      </div>
    );
  };

  return (
    <div
      className={`grid divide-x divide-slate-100 ${
        idx % 2 === 0 ? "bg-slate-50/50" : "bg-white/50"
      }`}
      style={{
        gridTemplateColumns: `100px repeat(${properties.length}, 1fr)`,
      }}
    >
      <div className="p-2 md:p-4 text-xs md:text-sm font-semibold text-slate-600 flex items-center gap-1 md:gap-2">
        <row.icon className="h-3 w-3 md:h-4 md:w-4 text-slate-400 shrink-0" />
        <span className="truncate">{row.label}</span>
      </div>
      {properties.map((p) => {
        // Check overlap Winner
        let val = 0;
        if (row.key === "property_size") val = p.size_sqm || 0;
        if (row.key === "bedrooms") val = p.bedrooms || 0;
        if (row.key === "bathrooms") val = p.bathrooms || 0;
        if (row.key === "parking_slots") val = p.parking_slots || 0;

        const isWinner = isNumericCompare && maxValue > 0 && val === maxValue;

        return (
          <div
            key={p.id}
            className={`p-2 md:p-4 text-xs md:text-sm text-slate-700 leading-relaxed transition-colors duration-500 ${
              isWinner ? "bg-green-50/60 font-medium" : ""
            }`}
          >
            {row.key === "price" ? (
              renderPriceCell(p)
            ) : row.key === "verified" ? (
              p.verified ? (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold border border-blue-100">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </div>
              ) : (
                <span className="text-slate-300">-</span>
              )
            ) : row.key === "features" ? (
              p.features && p.features.length > 0 ? (
                <div className="flex flex-wrap gap-1 md:gap-1.5">
                  {p.features.map((f) => (
                    <div
                      key={f.id}
                      className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 bg-slate-100 rounded text-slate-600 whitespace-nowrap"
                    >
                      {f.name}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-slate-300">-</span>
              )
            ) : row.key === "transportation" ? (
              p.near_transit && p.transit_station_name ? (
                <div className="flex flex-col items-start gap-1">
                  <span className="inline-flex px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 uppercase">
                    {p.transit_type} {p.transit_station_name}
                  </span>
                  {p.transit_distance_meters && (
                    <span className="text-xs text-slate-500 pl-1">
                      ห่าง {p.transit_distance_meters} ม.
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-slate-300">-</span>
              )
            ) : row.key === "zone" ? (
              p.popular_area ||
              p.district || <span className="text-slate-300">-</span>
            ) : row.key === "google_maps_link" ? (
              p.google_maps_link ? (
                <a
                  href={p.google_maps_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                >
                  <MapPin className="h-3 w-3" /> เปิดแผนที่
                </a>
              ) : (
                <span className="text-slate-300">-</span>
              )
            ) : row.key === "property_size" ? (
              p.size_sqm ? (
                <span className={isWinner ? "text-green-700 font-bold" : ""}>
                  {p.size_sqm} ตร.ม.
                </span>
              ) : (
                "-"
              )
            ) : row.key === "petFriendly" ? (
              isPetFriendly(p) ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200">
                  <Check className="h-3 w-3" /> เลี้ยงสัตว์ได้
                </div>
              ) : (
                <span className="text-slate-300">-</span>
              )
            ) : row.key === "listing_type" ? (
              <span className="inline-block px-2 py-1 rounded bg-slate-100 text-xs font-semibold text-slate-600">
                {cleanListingType(p.listing_type)}
              </span>
            ) : row.key === "updated_at" ? (
              new Date(p.updated_at).toLocaleDateString("th-TH")
            ) : row.key === "floor" ? (
              p.floor ? (
                `ชั้น ${p.floor}`
              ) : (
                "-"
              )
            ) : row.key === "parking_slots" ? (
              p.parking_slots ? (
                <span className={isWinner ? "text-green-700 font-bold" : ""}>
                  {p.parking_slots} คัน
                </span>
              ) : (
                "-"
              )
            ) : row.key === "bedrooms" || row.key === "bathrooms" ? (
              <span className={isWinner ? "text-green-700 font-bold" : ""}>
                {(p as any)[row.key] || "-"}
              </span>
            ) : (
              (p as any)[row.key] || <span className="text-slate-300">-</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
