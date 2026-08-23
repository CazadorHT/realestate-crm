"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface CoBrokerFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  ratingFilter: number | null;
  onRatingFilterChange: (val: number | null) => void;
}

export function CoBrokerFilters({
  search,
  onSearchChange,
  ratingFilter,
  onRatingFilterChange
}: CoBrokerFiltersProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="relative flex-1 max-w-md group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
        <Input
          placeholder={isEn ? "Search partner name, area, or phone..." : "ค้นหาชื่อคู่ค้า, พื้นที่, หรือเบอร์โทร..."}
          className="pl-11 h-12 bg-white border-slate-200 rounded-2xl focus:ring-blue-500 shadow-sm transition-all font-medium"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
         <span className="text-[10px] font-bold text-slate-400 px-3 uppercase tracking-widest border-r border-slate-200 mr-1">{isEn ? "Rating" : "เรตติ้ง"}</span>
         {[null, 3, 4, 5].map((val) => (
           <Button
              key={String(val)}
              variant={ratingFilter === val ? "secondary" : "ghost"}
              size="sm"
              className={`h-9 px-4 rounded-xl text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                ratingFilter === val 
                  ? "bg-white text-amber-700 shadow-sm ring-1 ring-amber-100" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
              onClick={() => onRatingFilterChange(val)}
           >
              {val === null ? (isEn ? "All" : "ทั้งหมด") : `${val}+ ⭐`}
           </Button>
         ))}
      </div>
    </div>
  );
}

