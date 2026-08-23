"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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
  const { language, t } = useLanguage();
  const isEn = language === "en";

  const [isPending, startTransition] = useTransition();
  const [targetPage, setTargetPage] = useState<number | null>(null);

  useEffect(() => {
    setTargetPage(null);
  }, [currentPage, searchParams]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage || isPending) return;
    setTargetPage(page);
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("page", page.toString());
      router.replace(`${pathname}?${params.toString()}#table`, { scroll: false });
    });
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
        <span className="hidden sm:inline">{isEn ? "Showing " : "แสดง "}</span>
        {Math.min(pageSize * (currentPage - 1) + 1, totalCount)} –{" "}
        {Math.min(pageSize * currentPage, totalCount)}{" "}
        <span className="text-slate-400 font-normal mx-1">/</span> {totalCount}{" "}
        {isEn ? "items" : "รายการ"}
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
        {/* Previous Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isPending}
          className="h-8 w-8 sm:h-9 sm:w-auto px-0 sm:px-3 text-slate-600 hover:bg-white hover:text-blue-600 transition-all rounded-lg disabled:opacity-50 cursor-pointer"
          title={isEn ? "Previous" : "ย้อนกลับ"}
        >
          {isPending && targetPage === currentPage - 1 ? (
            <Loader2 className="h-4 w-4 animate-spin sm:mr-1.5" />
          ) : (
            <ChevronLeft className="h-4 w-4 sm:mr-1.5" />
          )}
          <span className="hidden sm:inline">{isEn ? "Previous" : "ย้อนกลับ"}</span>
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
            const isLoadingThisPage = isPending && targetPage === page;

            return (
              <Button
                key={`page-${page}`}
                variant={isCurrent ? "default" : "ghost"}
                size="sm"
                onClick={() => handlePageChange(page as number)}
                disabled={isPending}
                className={cn(
                  "w-8 h-8 sm:w-9 sm:h-9 p-0 rounded-lg text-xs sm:text-sm transition-all font-medium cursor-pointer",
                  isCurrent
                    ? "bg-blue-600 text-white shadow-md hover:bg-blue-700 pointer-events-none scale-105"
                    : "text-slate-600 hover:bg-white hover:text-blue-600 border border-transparent hover:border-slate-100",
                  isLoadingThisPage && "bg-blue-50 text-blue-600 border-blue-200"
                )}
              >
                {isLoadingThisPage ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  page
                )}
              </Button>
            );
          })}
        </div>

        {/* Next Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isPending}
          className="h-8 w-8 sm:h-9 sm:w-auto px-0 sm:px-3 text-slate-600 hover:bg-white hover:text-blue-600 transition-all rounded-lg disabled:opacity-50 cursor-pointer"
          title={isEn ? "Next" : "ถัดไป"}
        >
          <span className="hidden sm:inline">{isEn ? "Next" : "ถัดไป"}</span>
          {isPending && targetPage === currentPage + 1 ? (
            <Loader2 className="h-4 w-4 animate-spin sm:ml-1.5" />
          ) : (
            <ChevronRight className="h-4 w-4 sm:ml-1.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
