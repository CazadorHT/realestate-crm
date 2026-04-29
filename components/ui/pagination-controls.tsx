"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLanguage, dictionaries } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  totalCount: number;
  pageSize: number;
  currentPage: number;
}

export function PaginationControls({
  totalCount,
  pageSize,
  currentPage,
}: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const isCRM = pathname?.includes("/protected");

  // Helper to force Thai for CRM, otherwise use context language
  const T = (key: string, params?: Record<string, string | number>): string => {
    if (isCRM) {
      const dict = dictionaries.th as Record<string, unknown>;
      let value = key.split(".").reduce((prev: unknown, curr: string) => {
        if (prev && typeof prev === "object") {
          return (prev as Record<string, unknown>)[curr];
        }
        return undefined;
      }, dict);
      
      if (typeof value !== "string") return key;

      let result = value;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(`{${k}}`, String(v));
        });
      }
      return result;
    }
    return t(key, params);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.replace(`${pathname}?${params.toString()}#table`, { scroll: false });
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const siblingCount = 1; // Number of siblings to show on each side
    const totalPageNumbers = 7; // Fixed count for consistent UI height/width

    if (totalPages <= totalPageNumbers) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
      const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

      const shouldShowLeftDots = leftSiblingIndex > 2;
      const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

      if (!shouldShowLeftDots && shouldShowRightDots) {
        let leftItemCount = 3 + 2 * siblingCount;
        for (let i = 1; i <= leftItemCount; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (shouldShowLeftDots && !shouldShowRightDots) {
        let rightItemCount = 3 + 2 * siblingCount;
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - rightItemCount + 1; i <= totalPages; i++)
          pages.push(i);
      } else if (shouldShowLeftDots && shouldShowRightDots) {
        pages.push(1);
        pages.push("...");
        for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++)
          pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 p-4 gap-4 bg-slate-50/50 rounded-xl border border-slate-100">
      <div className="text-xs sm:text-sm text-slate-500 font-medium order-2 sm:order-1">
        <span className="hidden sm:inline">{T("search.displaying")} </span>
        {Math.min(pageSize * (currentPage - 1) + 1, totalCount)} –{" "}
        {Math.min(pageSize * currentPage, totalCount)}{" "}
        <span className="text-slate-400 font-normal mx-1">/</span> {totalCount}{" "}
        {T("search.items")}
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
        {/* Previous Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 w-8 sm:h-9 sm:w-auto px-0 sm:px-3 text-slate-600 hover:bg-white hover:text-blue-600 transition-all rounded-lg"
          title={T("common.back")}
        >
          <ChevronLeft className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">{T("common.back")}</span>
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === "...") {
              return (
                <div
                  key={`dots-${index}`}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-400 text-xs sm:text-sm"
                >
                  ...
                </div>
              );
            }

            const isCurrent = page === currentPage;
            return (
              <Button
                key={`page-${page}`}
                variant={isCurrent ? "default" : "ghost"}
                size="sm"
                onClick={() => handlePageChange(page as number)}
                className={cn(
                  "w-8 h-8 sm:w-9 sm:h-9 p-0 rounded-lg text-xs sm:text-sm transition-all font-medium",
                  isCurrent
                    ? "bg-blue-600 text-white shadow-md hover:bg-blue-700 pointer-events-none scale-105"
                    : "text-slate-600 hover:bg-white hover:text-blue-600 border border-transparent hover:border-slate-100",
                )}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Next Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 sm:h-9 sm:w-auto px-0 sm:px-3 text-slate-600 hover:bg-white hover:text-blue-600 transition-all rounded-lg"
          title={T("common.next")}
        >
          <span className="hidden sm:inline">{T("common.next")}</span>
          <ChevronRight className="h-4 w-4 sm:ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
