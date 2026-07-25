"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Search, ArrowUpDown } from "lucide-react";

interface PopularAreaSearchHeaderProps {
  totalCount: number;
}

export function PopularAreaSearchHeader({
  totalCount,
}: PopularAreaSearchHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL-driven state
  const search = searchParams.get("search") || "";
  const [searchValue, setSearchValue] = useState(search);

  const sortBy = searchParams.get("sort") || "sort_order";
  const sortOrder = searchParams.get("order") || "asc";
  const currentSortKey = `${sortBy}-${sortOrder}`;

  // Sync state if URL changes externally
  useEffect(() => {
    setSearchValue(search);
  }, [search]);

  // Debounced search logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== search) {
        const params = new URLSearchParams(searchParams);
        if (searchValue) params.set("search", searchValue);
        else params.delete("search");
        params.set("page", "1"); // Reset to page 1 on new search
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, search, searchParams, pathname, router]);

  const handleSortChange = (value: string) => {
    const [sort, order] = value.split("-");
    const params = new URLSearchParams(searchParams);
    params.set("sort", sort);
    params.set("order", order);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white p-5 border border-slate-200 shadow-sm rounded-2xl animate-in fade-in duration-500">
      <div className="flex items-center gap-4 text-left">
        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100">
          <MapPin className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">
            ทำเลยอดนิยม ({totalCount})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            จัดการลำดับและข้อมูลสำคัญสำหรับหน้าบ้าน
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="ค้นหาทำเล..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all rounded-xl text-sm"
          />
        </div>

        <Select value={currentSortKey} onValueChange={handleSortChange}>
          <SelectTrigger className="h-11 border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-xs font-medium w-full sm:w-[190px] shrink-0">
            <div className="flex items-center gap-2 truncate">
              <ArrowUpDown className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <SelectValue placeholder="เรียงตาม" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="sort_order-asc" className="text-xs">
              ลำดับมาตรฐาน
            </SelectItem>
            <SelectItem
              value="created_at-desc"
              className="text-xs font-semibold text-indigo-600"
            >
              ✨ ใหม่ขึ้นก่อน (Newest)
            </SelectItem>
            <SelectItem value="created_at-asc" className="text-xs">
              เก่าขึ้นก่อน (Oldest)
            </SelectItem>
            <SelectItem value="name-asc" className="text-xs">
              ชื่อพื้นที่ (A-Z)
            </SelectItem>
            <SelectItem value="property_count-desc" className="text-xs">
              จำนวนทรัพย์มากสุด
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
