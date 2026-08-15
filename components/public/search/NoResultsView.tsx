"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Search, RotateCcw, Sparkles, MapPin, Building2, Lightbulb } from "lucide-react";

interface NoResultsViewProps {
  onClearFilters: () => void;
  keyword?: string;
  onClearKeyword?: () => void;
  areaFilterName?: string;
  onSelectSuggestion?: (text: string) => void;
  serverAreaTotal?: number;
  serverGrandTotal?: number;
  onFetchMoreServer?: () => void;
  isFetchingMore?: boolean;
}

const POPULAR_RECOVERY_TAGS: Record<string, { text: string; label: string }[]> = {
  en: [
    { text: "Sukhumvit", label: "Popular Area" },
    { text: "Ari", label: "Popular Area" },
    { text: "Bangna", label: "Popular Area" },
    { text: "Rama 9", label: "Popular Area" },
    { text: "Condo Near BTS/MRT", label: "Feature" },
    { text: "Pet Friendly Condo", label: "Feature" },
  ],
  cn: [
    { text: "素坤逸 (Sukhumvit)", label: "热门区域" },
    { text: "阿里 (Ari)", label: "热门区域" },
    { text: "邦纳 (Bangna)", label: "热门区域" },
    { text: "拉玛九 (Rama 9)", label: "热门区域" },
    { text: "轻轨旁公寓", label: "特色" },
    { text: "可养宠物公寓", label: "特色" },
  ],
  ru: [
    { text: "Сукхумвит (Sukhumvit)", label: "Популярный район" },
    { text: "Ари (Ari)", label: "Популярный район" },
    { text: "Банг На (Bangna)", label: "Популярный район" },
    { text: "Рама 9 (Rama 9)", label: "Популярный район" },
    { text: "Кондо рядом с метро", label: "Особенность" },
    { text: "Дог/Кэт френдли кондо", label: "Особенность" },
  ],
  th: [
    { text: "สุขุมวิท", label: "ย่านยอดนิยม" },
    { text: "อารีย์", label: "ย่านยอดนิยม" },
    { text: "บางนา", label: "ย่านยอดนิยม" },
    { text: "พระราม 9", label: "ย่านยอดนิยม" },
    { text: "คอนโดติดรถไฟฟ้า", label: "เงื่อนไขพิเศษ" },
    { text: "คอนโด เลี้ยงสัตว์ได้", label: "เงื่อนไขพิเศษ" },
  ],
};

export function NoResultsView({
  onClearFilters,
  keyword,
  onClearKeyword,
  areaFilterName,
  onSelectSuggestion,
  serverAreaTotal = 0,
  serverGrandTotal = 0,
  onFetchMoreServer,
  isFetchingMore,
}: NoResultsViewProps) {
  const { t, language } = useLanguage();

  const isEn = language === "en";
  const isCn = language === "cn";
  const isRu = language === "ru";

  const cleanKeyword = keyword?.trim();
  const cleanArea = areaFilterName && areaFilterName !== "ALL" ? areaFilterName.trim() : null;
  const currentTags = POPULAR_RECOVERY_TAGS[language] || POPULAR_RECOVERY_TAGS.th;

  // Title calculation
  const title = (() => {
    if (cleanKeyword) {
      if (isEn) return `No properties found for "${cleanKeyword}"`;
      if (isCn) return `未找到与 "${cleanKeyword}" 相关的房源`;
      if (isRu) return `По запросу "${cleanKeyword}" ничего не найдено`;
      return `ไม่พบผลลัพธ์สำหรับ "${cleanKeyword}"`;
    }
    if (cleanArea) {
      if (isEn) return `No properties matching current filters in "${cleanArea}"`;
      if (isCn) return `"${cleanArea}" 暂无符合当前筛选条件的房源`;
      if (isRu) return `В районе "${cleanArea}" нет объектов по текущим фильтрам`;
      return `ไม่พบทรัพย์สินในทำเล "${cleanArea}" ที่ตรงตามตัวกรอง`;
    }
    if (isEn) return "No properties match your filter criteria";
    if (isCn) return "未找到符合筛选条件的房源";
    if (isRu) return "Нет объектов, соответствующих критериям поиска";
    return "ไม่พบทรัพย์สินที่ตรงตามเงื่อนไขการค้นหา";
  })();

  // Subtitle calculation
  const subtitle = (() => {
    if (cleanKeyword) {
      if (isEn) return "The keyword you searched might not be in our system, or existing filters (price, property type) might be too specific.";
      if (isCn) return "您搜索的关键词可能不存在于系统中，或者当前筛选条件（如价格、物业类型）过于严格。";
      if (isRu) return "Возможно, в системе нет объектов по этому запросу, или применены слишком строгие фильтры.";
      return "คำค้นหานี้อาจยังไม่มีทรัพย์ในระบบ หรือตัวกรองอื่นๆ (เช่น ราคา, ประเภททรัพย์, ห้องนอน) ถูกจำกัดไว้แคบเกินไป";
    }
    if (cleanArea) {
      if (isEn) return "Try expanding your price range or clearing specific feature filters to see available listings.";
      if (isCn) return "尝试扩大价格范围或清除某些特定筛选条件以查看该区域房源。";
      if (isRu) return "Попробуйте расширить диапазон цен или сбросить фильтры.";
      return "ลองขยายช่วงราคา หรือปรับลดตัวกรองคุณสมบัติเพื่อดูทรัพย์สินอื่นๆ ในทำเลนี้";
    }
    if (isEn) return "Try adjusting your price range, property type, or clearing some filters to see all available properties.";
    if (isCn) return "尝试调整价格区间、物业类型或清除部分筛选条件以查看全部房源。";
    if (isRu) return "Попробуйте изменить параметры поиска или очистить фильтры.";
    return "ลองปรับลดเงื่อนไข เช่น ขยายช่วงราคา หรือกดล้างตัวกรองเพื่อดูทรัพย์ทั้งหมดในระบบ";
  })();

  const clearSearchText = (() => {
    if (isEn) return `Clear search "${cleanKeyword}"`;
    if (isCn) return `清除搜索 "${cleanKeyword}"`;
    if (isRu) return `Очистить поиск "${cleanKeyword}"`;
    return `ล้างคำค้นหา "${cleanKeyword}"`;
  })();

  const clearAllFiltersText = (() => {
    const fromT = t("search.clear_filters");
    if (fromT) return fromT;
    if (isEn) return "Clear All Filters";
    if (isCn) return "清除所有筛选";
    if (isRu) return "Сбросить все фильтры";
    return "ล้างตัวกรองทั้งหมด";
  })();

  return (
    <div className="py-12 px-6 sm:px-10 bg-gradient-to-b from-white via-slate-50/70 to-blue-50/20 rounded-3xl border border-slate-200/80 shadow-sm max-w-2xl mx-auto my-8 animate-in fade-in zoom-in-95 duration-300">
      {/* Icon Badge */}
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-inner border border-indigo-100/60">
        <Search className="w-8 h-8 text-indigo-600" />
      </div>

      {/* Main Title */}
      <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2 leading-snug">
        {title}
      </h3>

      {/* Subtitle */}
      <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto mb-6 leading-relaxed">
        {subtitle}
      </p>

      {/* 💡 Search Tips Box */}
      <div className="bg-white/80 rounded-2xl p-4 border border-slate-200/60 mb-6 text-left shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{isEn ? "Search Suggestions & Tips:" : isCn ? "搜索建议：" : isRu ? "Советы по поиску:" : "คำแนะนำในการค้นหา:"}</span>
        </div>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside pl-1">
          {cleanKeyword && (
            <li>
              {isEn
                ? "Check your spelling or try searching in English / Thai"
                : isCn
                ? "检查拼写或尝试用泰语/英语名称搜索"
                : isRu
                ? "Проверьте написание или введите название на тайском/английском"
                : "ตรวจสอบตัวสะกด หรือลองค้นหาด้วยชื่อโครงการภาษาอังกฤษ / ภาษาไทย"}
            </li>
          )}
          <li>
            {isEn
              ? "Try searching by broader areas, landmarks, or BTS / MRT stations"
              : isCn
              ? "尝试搜索更广的区域、地标或 BTS/MRT 站名"
              : isRu
              ? "Попробуйте искать по району, станции BTS/MRT или ориентиру"
              : "ลองค้นหาด้วยชื่อย่าน, ถนน, หรือสถานีรถไฟฟ้า BTS / MRT"}
          </li>
          <li>
            {isEn
              ? "Reset specific filters (e.g. price range, bedrooms) to view more listings"
              : isCn
              ? "重置部分筛选条件（如价格区间、房型）以查看更多房源"
              : isRu
              ? "Сбросьте фильтры цен или количества спален"
              : "ปรับขยายช่วงราคา หรือเลือกดูทุกประเภททรัพย์สิน"}
          </li>
        </ul>
      </div>

      {/* 🌟 1-Click Popular Search Recommendations */}
      {onSelectSuggestion && (
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            {isEn ? "Popular Search Topics" : isCn ? "热门搜索推荐" : isRu ? "Популярные запросы" : "หรือลองเลือกคำค้นหายอดนิยม:"}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {currentTags.map((tag) => (
              <button
                key={tag.text}
                type="button"
                onClick={() => onSelectSuggestion(tag.text)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-medium border border-slate-200/60 hover:border-indigo-200 transition-all cursor-pointer group active:scale-95"
              >
                <Sparkles className="w-3 h-3 text-indigo-500 opacity-60 group-hover:opacity-100" />
                <span>{tag.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-slate-100">
        {cleanKeyword && onClearKeyword && (
          <Button
            variant="outline"
            onClick={onClearKeyword}
            className="rounded-xl border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs h-10 px-4 cursor-pointer"
          >
            {clearSearchText}
          </Button>
        )}

        <Button
          onClick={onClearFilters}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs h-10 px-5 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{clearAllFiltersText}</span>
        </Button>
      </div>
    </div>
  );
}


