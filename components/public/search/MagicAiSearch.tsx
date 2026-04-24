"use client";

import { useState, useEffect } from "react";
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
        <div className="pl-4 text-slate-400">
          <Search className="h-5 w-5" />
        </div>
        
        <Input
          placeholder={
            language === "th" 
              ? "ค้นหาด้วยคำสำคัญ (เช่น คอนโด อารีย์)" 
              : language === "cn"
                ? "搜索关键词 (例如: 阿里公寓)"
                : "Search by keywords (e.g. Condo Ari)"
          }
          className="border-none shadow-none focus-visible:ring-0 h-12 text-sm! bg-transparent w-full font-medium placeholder:text-slate-400"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={globalLoading}
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
