"use client";

import { Button } from "@/components/ui/button";

interface DealsPaginationProps {
  page: number;
  setPage: (p: (prev: number) => number) => void;
  totalPages: number;
  pageSize: number;
  count: number;
}

export function DealsPagination({
  page,
  setPage,
  totalPages,
  pageSize,
  count,
}: DealsPaginationProps) {
  if (count === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-4 bg-white border border-slate-200 rounded-lg shadow-xs">
      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight text-center sm:text-left">
        แสดง{" "}
        <span className="text-slate-900">
          {Math.min(count, (page - 1) * pageSize + 1)}
        </span>{" "}
        -{" "}
        <span className="text-slate-900">
          {Math.min(count, page * pageSize)}
        </span>{" "}
        จาก <span className="text-slate-900">{count}</span> ดีล
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="h-8 text-[11px] font-bold uppercase tracking-tight hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
        >
          ก่อนหน้า
        </Button>
        <div className="h-8 px-3 flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700">
          {page} / {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="h-8 text-[11px] font-bold uppercase tracking-tight hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
        >
          ถัดไป
        </Button>
      </div>
    </div>
  );
}
