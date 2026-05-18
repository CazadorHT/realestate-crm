"use client";

import { useState, useEffect, useId } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface MagicAiSearchProps {
  keyword: string;
  setKeyword: (v: string) => void;
  isLoading?: boolean;
}

/**
 * 🔍 Standard Search Bar
 * Simple, fast, and auto-updates as you type.
 */
export function MagicAiSearch({
  keyword,
  setKeyword,
  isLoading: globalLoading = false,
}: MagicAiSearchProps) {
  const { language } = useLanguage();
  const searchId = useId();
  const [inputValue, setInputValue] = useState(keyword);

  // Auto-search with 500ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(inputValue);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputValue, setKeyword]);

  // Sync internal state if external keyword changes (e.g. clear filters)
  useEffect(() => {
    setInputValue(keyword);
  }, [keyword]);

  return (
    <div className="relative group w-full">
      <div className="relative flex items-center bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400">
        {/* [PREMIUM LOADING BAR] */}
        {globalLoading && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-100 overflow-hidden z-50">
            <div className="h-full bg-indigo-500 animate-loading-bar shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          </div>
        )}

        <div className="pl-3.5 text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        
        <Input
          id={searchId}
          name="keyword"
          placeholder={
            language === "th" 
              ? "ค้นหาทำเล, ประเภททรัพย์, จำนวนห้อง (เช่น คอนโดอารีย์ 2นอน)" 
              : language === "cn"
                ? "搜索地点, 房产类型, 卧室数量 (例如: 阿里公寓 2室)"
                : language === "ru"
                  ? "Поиск по местоположению, типу и комнатам (например: Кондо Ари 2 сп)"
                  : "Search location, type, rooms (e.g. Condo Ari 2bed)"
          }
          className="border-none shadow-none focus-visible:ring-0 h-10! text-xs bg-transparent w-full font-medium placeholder:text-[12px] placeholder:text-slate-400/80"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={false} // Keep input enabled even when loading for better UX
        />

        <div className="pr-1.5 flex items-center">
          {inputValue && (
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              onClick={() => {
                setInputValue("");
                setKeyword("");
              }}
            >
              <span className="text-lg">×</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
