"use client";

import { m, AnimatePresence } from "framer-motion";
import { PropertyCard, PropertyCardProps } from "../PropertyCard";
import { useLanguage } from "@/components/providers/LanguageProvider";

type ApiProperty = PropertyCardProps;

interface PropertyGridProps {
  properties: ApiProperty[];
  currentPage: number;
  hasMore?: boolean;
  areaRemainingCount?: number;
  totalRemainingCount?: number;
  isFetchingMore?: boolean;
  loadMore?: () => void;
  areaFilterName?: string;
  filterLabel?: string;
}

/**
 * [S-Tier] Optimized Property Grid
 * - Supports Priority Loading for top results (LCP boost)
 * - Smooth AnimatePresence transitions
 * - Interactive Dashed Card for Load More Discovery UX
 */
export function PropertyGrid({
  properties,
  currentPage,
  hasMore,
  areaRemainingCount = 0,
  totalRemainingCount = 0,
  isFetchingMore,
  loadMore,
  areaFilterName,
  filterLabel,
}: PropertyGridProps) {
  const { language } = useLanguage();

  return (
    <div
      className="grid gap-6 md:gap-y-8 lg:gap-x-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mb-12"
    >
      <AnimatePresence>
        {properties.map((item, i) => (
          <m.div
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              duration: 0.2,
              delay: Math.min(i * 0.02, 0.2),
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            <PropertyCard
              property={item}
              priority={i < 4 && currentPage === 1}
            />
          </m.div>
        ))}

        {/* Load More Discovery Card for Desktop & Mobile Grid */}
        {hasMore && loadMore && (
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex h-full min-h-[380px]"
          >
            <button
              type="button"
              onClick={loadMore}
              disabled={isFetchingMore}
              className="w-full h-full flex flex-col items-center justify-center p-6 text-center rounded-3xl border-2 border-dashed border-blue-400/70 hover:border-blue-600 bg-gradient-to-b from-blue-50/40 via-white to-blue-50/60 hover:from-blue-50/90 hover:to-blue-100/70 transition-all duration-300 group cursor-pointer shadow-xs hover:shadow-xl hover:shadow-blue-500/10 active:scale-[0.98] disabled:opacity-60"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center mb-4 transition-all duration-300 shadow-inner group-hover:scale-110">
                {isFetchingMore ? (
                  <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                )}
              </div>

              <h4 className="text-base sm:text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors mb-1">
                {filterLabel
                  ? language === "en"
                    ? `More ${filterLabel} available`
                    : language === "cn"
                    ? `更多${filterLabel}房源`
                    : language === "ru"
                    ? `Больше объектов (${filterLabel})`
                    : `ยังมี${filterLabel}ในระบบอีก`
                  : areaFilterName && areaFilterName.toLowerCase() !== "all"
                  ? language === "en"
                    ? `More properties in "${areaFilterName}"`
                    : language === "cn"
                    ? `"${areaFilterName}" 还有更多房源`
                    : language === "ru"
                    ? `Больше объектов в "${areaFilterName}"`
                    : `ยังมีทรัพย์สินในทำเล "${areaFilterName}" อีก`
                  : language === "en"
                  ? "More properties matching your criteria"
                  : language === "cn"
                  ? "符合条件的更多房源"
                  : language === "ru"
                  ? "Больше объектов по вашим критериям"
                  : "ยังมีทรัพย์สินเพิ่มเติมที่ตรงตามเงื่อนไข"}
              </h4>

              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
                {(() => {
                  const remaining = areaFilterName && areaFilterName.toLowerCase() !== "all" && areaRemainingCount > 0
                    ? areaRemainingCount
                    : totalRemainingCount;
                  const nextBatch = Math.min(12, remaining);
                  if (remaining <= 0) return null;

                  return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-xs">
                      {language === "en"
                        ? `+${nextBatch} Properties`
                        : language === "cn"
                        ? `+${nextBatch} 套房源`
                        : language === "ru"
                        ? `+${nextBatch} объектов`
                        : `+${nextBatch} รายการ`}
                    </span>
                  );
                })()}
              </div>

              <p className="text-xs sm:text-sm text-slate-500 group-hover:text-slate-700 transition-colors font-medium">
                {(() => {
                  const remaining = areaFilterName && areaFilterName.toLowerCase() !== "all" && areaRemainingCount > 0
                    ? areaRemainingCount
                    : totalRemainingCount;
                  const nextBatch = Math.min(12, remaining);

                  if (isFetchingMore) {
                    return language === "en"
                      ? "Loading more properties..."
                      : language === "cn"
                      ? "正在加载更多房源..."
                      : language === "ru"
                      ? "Загрузка объектов..."
                      : "กำลังดึงข้อมูลเพิ่มเติม...";
                  }

                  if (remaining > nextBatch) {
                    return language === "en"
                      ? `Click to load +${nextBatch} more (${remaining} remaining)`
                      : language === "cn"
                      ? `点击加载 +${nextBatch} 套 (还剩 ${remaining} 套)`
                      : language === "ru"
                      ? `Загрузить +${nextBatch} (осталось ${remaining})`
                      : `กดโหลดเพิ่มอีก ${nextBatch} รายการ (คงเหลืออีก ${remaining} รายการ)`;
                  }

                  return language === "en"
                    ? `Click to load remaining ${nextBatch} properties`
                    : language === "cn"
                    ? `点击加载剩余 ${nextBatch} 套房源`
                    : language === "ru"
                    ? `Загрузить оставшиеся ${nextBatch} объектов`
                    : `กดโหลด ${nextBatch} รายการที่เหลือ`;
                })()}
              </p>
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
