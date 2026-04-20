"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Search, ArrowRight } from "lucide-react";
import { getAgenticSearchIntentAction } from "@/features/properties/actions/agentic-search";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

interface MagicAiSearchProps {
  keyword: string;
  setKeyword: (v: string) => void;
  setBulkFilters: (updates: any) => void;
  isLoading?: boolean;
}

/**
 * ⚡ [Elite] Magic AI Search Bar
 * Uses Gemini 1.5 Flash to parse natural language intent.
 */
export function MagicAiSearch({
  keyword,
  setKeyword,
  setBulkFilters,
  isLoading: globalLoading = false,
}: MagicAiSearchProps) {
  const { language } = useLanguage();
  const [inputValue, setInputValue] = useState(keyword);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleMagicSearch = async () => {
    if (!inputValue.trim() || inputValue.length < 3) return;

    setIsAiLoading(true);
    try {
      const result = await getAgenticSearchIntentAction(inputValue, language);
      if (result.success && result.intent) {
        setBulkFilters({
          ...result.intent.filters,
          aiInsight: result.intent.aiInsight,
        });
        toast.success(language === "th" ? "AI ช่วยปรับฟิลเตอร์ให้แล้วครับ" : "AI improved your filters!");
      } else {
        // Fallback to normal keyword search if AI fails
        setKeyword(inputValue);
      }
    } catch (error) {
      console.error("Magic search error:", error);
      setKeyword(inputValue);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleMagicSearch();
    }
  };

  return (
    <div className="relative group w-full">
      {/* Decorative Aura */}
      <div className="absolute -inset-0.5 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-sm opacity-20 group-focus-within:opacity-40 transition-opacity duration-500" />
      
      <div className="relative flex items-center bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400">
        <div className="pl-4 text-slate-400">
          {isAiLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
          ) : (
            <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
          )}
        </div>
        
        <Input
          placeholder={language === "th" ? "พิมพ์สิ่งที่ต้องการ (เช่น คอนโดเลี้ยงสัตว์ได้แถวอารีย์ งบ 2 หมื่น)" : "Search with AI (e.g. Pet-friendly condo in Ari under 20k)"}
          className="border-none shadow-none focus-visible:ring-0 h-12 text-sm bg-transparent w-full font-medium placeholder:text-slate-400"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isAiLoading || globalLoading}
        />

        <div className="pr-1.5 flex items-center gap-1">
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
          
          <Button
            size="sm"
            className={cn(
              "h-9 px-4 rounded-lg font-bold gap-2 transition-all",
              isAiLoading 
                ? "bg-slate-100 text-slate-400" 
                : "bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-indigo-500/25"
            )}
            onClick={handleMagicSearch}
            disabled={isAiLoading || globalLoading || !inputValue.trim()}
          >
            {isAiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span className="hidden sm:inline">Ask AI</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Floating Sparkle Elements */}
      {!isAiLoading && (
        <div className="absolute -top-1 -right-1 flex gap-0.5">
          <div className="w-1 h-1 bg-amber-400 rounded-full animate-ping delay-100" />
          <div className="w-1 h-1 bg-blue-400 rounded-full animate-ping delay-300" />
        </div>
      )}
    </div>
  );
}
