"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface NoResultsViewProps {
  onClearFilters: () => void;
  areaFilterName?: string;
  serverAreaTotal?: number;
  serverGrandTotal?: number;
  onFetchMoreServer?: () => void;
  isFetchingMore?: boolean;
}

export function NoResultsView({
  onClearFilters,
  areaFilterName,
  serverAreaTotal = 0,
  serverGrandTotal = 0,
  onFetchMoreServer,
  isFetchingMore,
}: NoResultsViewProps) {
  const { t, language } = useLanguage();

  return (
    <div className="text-center py-16 px-6 bg-gradient-to-b from-white via-slate-50/50 to-blue-50/20 rounded-3xl border border-slate-200/80 shadow-xs max-w-2xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
        {areaFilterName 
          ? language === "en"
            ? `Properties available in "${areaFilterName}" (${serverAreaTotal > 0 ? serverAreaTotal : "Multiple"} items)`
            : language === "cn"
            ? `"${areaFilterName}" 共有 (${serverAreaTotal > 0 ? serverAreaTotal : "多"} 套) 房源`
            : language === "ru"
            ? `Объекты в "${areaFilterName}" (${serverAreaTotal > 0 ? serverAreaTotal : "несколько"})`
            : `มีทรัพย์สินในทำเล "${areaFilterName}" ในระบบ (${serverAreaTotal > 0 ? serverAreaTotal : "หลาย"} รายการ)`
          : t("search.no_results") || "ไม่พบผลลัพธ์การค้นหา"}
      </h3>

      <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
        {areaFilterName
          ? language === "en"
            ? `Click the button below to load listings in "${areaFilterName}" immediately`
            : language === "cn"
            ? `点击下方按钮立即加载 "${areaFilterName}" 房源`
            : language === "ru"
            ? `Нажмите кнопку ниже, чтобы загрузить объекты в "${areaFilterName}"`
            : `กดปุ่มด้านล่างเพื่อโหลดแสดงรายการทรัพย์สินทำเล "${areaFilterName}" ได้ทันที`
          : language === "en"
          ? "Try adjusting your search criteria or clear filters"
          : language === "cn"
          ? "尝试调整搜索条件或清除筛选"
          : language === "ru"
          ? "Попробуйте изменить параметры поиска или очистить фильтры"
          : "ลองปรับเปลี่ยนเงื่อนไขการค้นหา หรือกดปุ่มล้างตัวกรอง"}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onFetchMoreServer && (
          <Button
            onClick={onFetchMoreServer}
            disabled={isFetchingMore}
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-7 py-3 shadow-lg shadow-blue-500/25 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            {isFetchingMore ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>
                  {language === "en" ? "Loading from server..." :
                   language === "cn" ? "正在从服务器加载..." :
                   language === "ru" ? "Загрузка с сервера..." :
                   "กำลังโหลดข้อมูลทรัพย์จากเซิร์ฟเวอร์..."}
                </span>
              </div>
            ) : (
              <span>
                {areaFilterName
                  ? language === "en"
                    ? `👉 Load properties in "${areaFilterName}" ${serverAreaTotal > 0 ? `(+${serverAreaTotal})` : ""}`
                    : language === "cn"
                    ? `👉 获取 "${areaFilterName}" 房源 ${serverAreaTotal > 0 ? `(+${serverAreaTotal})` : ""}`
                    : language === "ru"
                    ? `👉 Загрузить объекты в "${areaFilterName}" ${serverAreaTotal > 0 ? `(+${serverAreaTotal})` : ""}`
                    : `👉 กดดึงข้อมูลทำเล "${areaFilterName}" ${serverAreaTotal > 0 ? `(+${serverAreaTotal} รายการ)` : ""}`
                  : language === "en"
                  ? "Search more properties in system"
                  : language === "cn"
                  ? "在系统中搜索更多房源"
                  : language === "ru"
                  ? "Найти больше объектов"
                  : `ค้นหาทรัพย์สินเพิ่มเติมในระบบ`}
              </span>
            )}
          </Button>
        )}

        <Button
          variant="outline"
          onClick={onClearFilters}
          className="rounded-xl border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
        >
          {t("search.clear_filters") || "ล้างตัวกรองทั้งหมด"}
        </Button>
      </div>
    </div>
  );
}

