"use client";

import Link from "next/link";
import { MapPin, Home, TrendingUp } from "lucide-react";
import { PropertyMatch, PropertyType } from "@/features/smart-match/types";
import { getTypeColor, getTypeLabel } from "@/lib/property-utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface ResultCardProps {
  match: PropertyMatch;
  isRent: boolean;
  onSelect: () => void;
}

export function ResultCard({ match, isRent, onSelect }: ResultCardProps) {
  const { t } = useLanguage();

  const PROPERTY_TYPE_NAMES: Partial<Record<PropertyType, string>> = {
    CONDO: t("home.property_types.condo"),
    HOUSE: t("home.property_types.house"),
    TOWNHOME: t("home.property_types.townhome"),
    OFFICE_BUILDING: t("home.property_types.office"),
    LAND: t("home.property_types.land"),
    WAREHOUSE: t("home.property_types.warehouse"),
  };
  return (
    <div className="relative border border-slate-100 rounded-2xl overflow-visible hover:shadow-md transition-all duration-300 hover:z-30 bg-slate-50/50 p-4">
      <Link
        href={`/properties/${match.slug || match.id}`}
        target="_blank"
        className="block"
      >
        <div className="flex gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden shrink-0 bg-slate-200">
            <img
              src={match.image_url}
              alt={match.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-slate-900 truncate pr-2 hover:text-blue-600 transition-colors">
                {match.title}
              </h3>
              <div className="relative group/score">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded cursor-help transition-all hover:bg-blue-100 whitespace-nowrap">
                  {t("smart_match.match_score_label")}
                  {" " + match.match_score + "%"}
                </span>

                {/* Tooltip Breakdown */}
                {match.score_breakdown && match.score_breakdown.length > 0 && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-3 z-50 opacity-0 invisible group-hover/score:opacity-100 group-hover/score:visible transition-all duration-200 origin-top-right scale-95 group-hover/score:scale-100 pointer-events-none">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-50 pb-1">
                      {t("smart_match.score_details")}
                    </div>
                    <div className="space-y-1.5">
                      {match.score_breakdown.map(
                        (
                          item: { label: string; points: number },
                          i: number,
                        ) => (
                          <div
                            key={i}
                            className="flex justify-between items-center text-xs"
                          >
                            <span className="text-slate-600">
                              {t(`smart_match.breakdown.${item.label}`)}
                            </span>
                            <span className="font-bold text-blue-600">
                              {item.points > 0
                                ? `+${item.points}`
                                : item.points}
                            </span>
                          </div>
                        ),
                      )}
                      <div className="pt-1 mt-1 border-t border-slate-50 flex justify-between items-center font-bold text-xs text-slate-900 uppercase">
                        <span>{t("smart_match.score_total")}</span>
                        <span className="text-blue-600">
                          {match.match_score} %
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 mt-1">
              <div>
                {match.original_price && (
                  <div className="text-xs text-slate-400 line-through leading-none mb-0.5">
                    ฿ {match.original_price.toLocaleString()}
                  </div>
                )}
                <div className="text-sm font-bold text-blue-600">
                  {match.price > 0 ? (
                    <div className="flex flex-wrap items-baseline gap-1">
                      <span>฿ {match.price.toLocaleString()}</span>
                      {match.is_sqm_price ? (
                        <span className="text-[10px] font-medium">
                          / {t("common.sqm")}
                        </span>
                      ) : (
                        isRent && (
                          <span className="text-[10px] font-medium">
                            / {t("common.per_month")}
                          </span>
                        )
                      )}

                      {match.secondary_price && (
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          (฿ {match.secondary_price.toLocaleString()} / ตร.ม.)
                        </span>
                      )}
                    </div>
                  ) : (
                    t("common.contact_for_price")
                  )}
                </div>
              </div>
              {match.property_type && (
                <span
                  className={`text-xs font-bold ${
                    getTypeColor(match.property_type).text
                  } ${
                    getTypeColor(match.property_type).bg
                  } px-2 py-0.5 rounded-full uppercase tracking-wide`}
                >
                  {match.property_type
                    ? t(
                        `home.property_types.${match.property_type.toLowerCase()}`,
                      )
                    : t("common.all")}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              {(match.bedrooms || match.bathrooms) && (
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                  <Home className="h-3 w-3" />
                  {match.bedrooms || 0} {t("smart_match.bed_short")} •{" "}
                  {match.bathrooms || 0} {t("smart_match.bath_short")}
                </div>
              )}
              <div className="flex items-center gap-1 text-[10px] text-green-700 font-bold bg-green-50 border border-green-200 px-2 py-1 rounded-md">
                <MapPin className="h-3 w-3" />
                {match.commute_time} {t("smart_match.mins_to_work")}
              </div>
              {match.near_transit && match.transit_station_name && (
                <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                  <TrendingUp className="h-3 w-3" />
                  {match.transit_type || "BTS"} {match.transit_station_name}
                  {match.transit_distance_meters
                    ? ` (${match.transit_distance_meters} ${t("common.meters_short")})`
                    : ""}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
