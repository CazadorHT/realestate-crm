"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.replace(`${pathname}?${params.toString()}#table`, { scroll: false });
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 p-4 gap-4 bg-slate-50/50 rounded-xl border border-slate-100">
      <div className="text-xs sm:text-sm text-slate-500 font-medium order-2 sm:order-1">
        <span className="hidden sm:inline">แสดง </span>
        {Math.min(pageSize * (currentPage - 1) + 1, totalCount)} –{" "}
        {Math.min(pageSize * currentPage, totalCount)}{" "}
        <span className="text-slate-400 font-normal mx-1">/</span> {totalCount}{" "}
        รายการ
      </div>

      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-9 px-2 sm:px-3 text-slate-600 border-slate-200 hover:bg-white hover:text-blue-600 transition-all rounded-lg active:scale-95"
        >
          <ChevronLeft className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">ก่อนหน้า</span>
        </Button>

        <div className="bg-white border border-slate-200 px-3 h-9 flex items-center justify-center rounded-lg shadow-xs min-w-[80px]">
          <span className="text-xs sm:text-sm font-bold text-slate-700">
            {currentPage}{" "}
            <span className="text-slate-300 font-normal mx-1">/</span>{" "}
            {totalPages}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-9 px-2 sm:px-3 text-slate-600 border-slate-200 hover:bg-white hover:text-blue-600 transition-all rounded-lg active:scale-95"
        >
          <span className="hidden sm:inline">ถัดไป</span>
          <ChevronRight className="h-4 w-4 sm:ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
