"use client";

import { useState, useEffect, useId, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Building2, Sparkles, TrainTrack, Compass, X } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { getDynamicSearchSuggestionsAction, type DynamicSuggestionItem } from "@/features/public/popular-areas";

interface MagicAiSearchProps {
  keyword: string;
  setKeyword: (v: string) => void;
  isLoading?: boolean;
}

interface SuggestionItem {
  text: string;
  type: "landmark" | "transit" | "area" | "feature";
  label: string;
}

const DEFAULT_SUGGESTIONS: SuggestionItem[] = [
  // 📍 Landmarks & Major Shopping Malls ("ใกล้...")
  { text: "ใกล้ เซ็นทรัลบางนา", type: "landmark", label: "แลนด์มาร์ก" },
  { text: "ใกล้ เมกาบางนา", type: "landmark", label: "แลนด์มาร์ก" },
  { text: "ใกล้ ไอคอนสยาม", type: "landmark", label: "แลนด์มาร์ก" },
  { text: "ใกล้ เซ็นทรัลพระราม 9", type: "landmark", label: "แลนด์มาร์ก" },
  { text: "ใกล้ เซ็นทรัลลาดพร้าว", type: "landmark", label: "แลนด์มาร์ก" },
  { text: "ใกล้ เซ็นทรัลเวิลด์", type: "landmark", label: "แลนด์มาร์ก" },
  { text: "ใกล้ สยามพารากอน", type: "landmark", label: "แลนด์มาร์ก" },
  { text: "ใกล้ เอ็มควอเทียร์", type: "landmark", label: "แลนด์มาร์ก" },
  { text: "ใกล้ เอ็มสเฟียร์", type: "landmark", label: "แลนด์มาร์ก" },
  { text: "ใกล้ เทอร์มินอล 21", type: "landmark", label: "แลนด์มาร์ก" },
  { text: "ใกล้ สามย่านมิตรทาวน์", type: "landmark", label: "แลนด์มาร์ก" },
  { text: "ใกล้ ทรู ดิจิทัล พาร์ค", type: "landmark", label: "แลนด์มาร์ก" },
  { text: "ใกล้ สิงห์ คอมเพล็กซ์", type: "landmark", label: "แลนด์มาร์ก" },
  { text: "ใกล้ สวนหลวง ร.9", type: "landmark", label: "แลนด์มาร์ก" },
  { text: "ใกล้ สนามบินสุวรรณภูมิ", type: "landmark", label: "แลนด์มาร์ก" },
  { text: "ใกล้ สนามบินดอนเมือง", type: "landmark", label: "แลนด์มาร์ก" },
  { text: "ใกล้ รพ.บำรุงราษฎร์", type: "landmark", label: "แลนด์มาร์ก" },
  { text: "ใกล้ รพ.สมิติเวช", type: "landmark", label: "แลนด์มาร์ก" },
  { text: "ใกล้ รพ.จุฬาลงกรณ์", type: "landmark", label: "แลนด์มาร์ก" },

  // 🚆 BTS Stations
  { text: "ใกล้ BTS อุดมสุข", type: "transit", label: "รถไฟฟ้า BTS" },
  { text: "ใกล้ BTS อโศก", type: "transit", label: "รถไฟฟ้า BTS" },
  { text: "ใกล้ BTS ทองหล่อ", type: "transit", label: "รถไฟฟ้า BTS" },
  { text: "ใกล้ BTS พร้อมพงษ์", type: "transit", label: "รถไฟฟ้า BTS" },
  { text: "ใกล้ BTS อารีย์", type: "transit", label: "รถไฟฟ้า BTS" },
  { text: "ใกล้ BTS บางนา", type: "transit", label: "รถไฟฟ้า BTS" },
  { text: "ใกล้ BTS แบริ่ง", type: "transit", label: "รถไฟฟ้า BTS" },
  { text: "ใกล้ BTS อ่อนนุช", type: "transit", label: "รถไฟฟ้า BTS" },
  { text: "ใกล้ BTS ปุณณวิถี", type: "transit", label: "รถไฟฟ้า BTS" },
  { text: "ใกล้ BTS เอกมัย", type: "transit", label: "รถไฟฟ้า BTS" },
  { text: "ใกล้ BTS พระโขนง", type: "transit", label: "รถไฟฟ้า BTS" },
  { text: "ใกล้ BTS พญาไท", type: "transit", label: "รถไฟฟ้า BTS" },
  { text: "ใกล้ BTS สยาม", type: "transit", label: "รถไฟฟ้า BTS" },
  { text: "ใกล้ BTS ชิดลม", type: "transit", label: "รถไฟฟ้า BTS" },
  { text: "ใกล้ BTS เพลินจิต", type: "transit", label: "รถไฟฟ้า BTS" },
  { text: "ใกล้ BTS สะพานควาย", type: "transit", label: "รถไฟฟ้า BTS" },
  { text: "ใกล้ BTS หมอชิต", type: "transit", label: "รถไฟฟ้า BTS" },
  { text: "ใกล้ BTS ช่องนนทรี", type: "transit", label: "รถไฟฟ้า BTS" },
  { text: "ใกล้ BTS บางหว้า", type: "transit", label: "รถไฟฟ้า BTS" },
  { text: "ใกล้ BTS ห้าแยกลาดพร้าว", type: "transit", label: "รถไฟฟ้า BTS" },

  // 🚇 MRT Stations
  { text: "ใกล้ MRT พระราม 9", type: "transit", label: "รถไฟฟ้า MRT" },
  { text: "ใกล้ MRT ห้วยขวาง", type: "transit", label: "รถไฟฟ้า MRT" },
  { text: "ใกล้ MRT สุขุมวิท", type: "transit", label: "รถไฟฟ้า MRT" },
  { text: "ใกล้ MRT สุทธิสาร", type: "transit", label: "รถไฟฟ้า MRT" },
  { text: "ใกล้ MRT ลาดพร้าว", type: "transit", label: "รถไฟฟ้า MRT" },
  { text: "ใกล้ MRT พหลโยธิน", type: "transit", label: "รถไฟฟ้า MRT" },
  { text: "ใกล้ MRT สีลม", type: "transit", label: "รถไฟฟ้า MRT" },
  { text: "ใกล้ MRT สามย่าน", type: "transit", label: "รถไฟฟ้า MRT" },
  { text: "ใกล้ MRT เพชรบุรี", type: "transit", label: "รถไฟฟ้า MRT" },
  { text: "ใกล้ MRT ศูนย์สิริกิติ์", type: "transit", label: "รถไฟฟ้า MRT" },
  { text: "ใกล้ MRT ศรีเอี่ยม", type: "transit", label: "รถไฟฟ้า MRT" },
  { text: "ใกล้ MRT ศรีอุดม", type: "transit", label: "รถไฟฟ้า MRT" },
  { text: "ใกล้ MRT ศรีนครินทร์ 38", type: "transit", label: "รถไฟฟ้า MRT" },

  // 🏢 Popular Areas
  { text: "บางนา", type: "area", label: "ย่านยอดนิยม" },
  { text: "อารีย์", type: "area", label: "ย่านยอดนิยม" },
  { text: "สุขุมวิท", type: "area", label: "ย่านยอดนิยม" },
  { text: "ทองหล่อ", type: "area", label: "ย่านยอดนิยม" },
  { text: "เอกมัย", type: "area", label: "ย่านยอดนิยม" },
  { text: "พระราม 9", type: "area", label: "ย่านยอดนิยม" },
  { text: "สาทร", type: "area", label: "ย่านยอดนิยม" },
  { text: "สีลม", type: "area", label: "ย่านยอดนิยม" },
  { text: "รัชดา", type: "area", label: "ย่านยอดนิยม" },
  { text: "พญาไท", type: "area", label: "ย่านยอดนิยม" },
  { text: "ห้วยขวาง", type: "area", label: "ย่านยอดนิยม" },
  { text: "ลาดพร้าว", type: "area", label: "ย่านยอดนิยม" },
  { text: "อ่อนนุช", type: "area", label: "ย่านยอดนิยม" },
  { text: "ปุณณวิถี", type: "area", label: "ย่านยอดนิยม" },
  { text: "อุดมสุข", type: "area", label: "ย่านยอดนิยม" },
  { text: "ลาซาล", type: "area", label: "ย่านยอดนิยม" },
  { text: "แบริ่ง", type: "area", label: "ย่านยอดนิยม" },
  { text: "เชียงใหม่", type: "area", label: "ย่านยอดนิยม" },
  { text: "ภูเก็ต", type: "area", label: "ย่านยอดนิยม" },
  { text: "พัทยา", type: "area", label: "ย่านยอดนิยม" },

  // ✨ Property Features & Types
  { text: "คอนโด เลี้ยงสัตว์ได้", type: "feature", label: "เงื่อนไขพิเศษ" },
  { text: "คอนโดติดรถไฟฟ้า", type: "feature", label: "เงื่อนไขพิเศษ" },
  { text: "คอนโด 2 ห้องนอน", type: "feature", label: "เงื่อนไขพิเศษ" },
  { text: "บ้านเดี่ยว พร้อมอยู่", type: "feature", label: "เงื่อนไขพิเศษ" },
  { text: "ทาวน์โฮม บางนา", type: "feature", label: "เงื่อนไขพิเศษ" },
];

export function MagicAiSearch({
  keyword,
  setKeyword,
  isLoading: globalLoading = false,
}: MagicAiSearchProps) {
  const { language } = useLanguage();
  const searchId = useId();
  const [inputValue, setInputValue] = useState(keyword);
  const [isOpen, setIsOpen] = useState(false);
  const [allSuggestions, setAllSuggestions] = useState<SuggestionItem[]>(DEFAULT_SUGGESTIONS);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch dynamic suggestions from DB (Step 3 nearby places + projects + master data)
  useEffect(() => {
    getDynamicSearchSuggestionsAction()
      .then((dynamicItems) => {
        if (dynamicItems && dynamicItems.length > 0) {
          const map = new Map<string, SuggestionItem>();
          // Put DB items first
          for (const item of dynamicItems) {
            map.set(item.text.toLowerCase().trim(), item);
          }
          // Put defaults as fallback
          for (const item of DEFAULT_SUGGESTIONS) {
            const key = item.text.toLowerCase().trim();
            if (!map.has(key)) {
              map.set(key, item);
            }
          }
          setAllSuggestions(Array.from(map.values()));
        }
      })
      .catch((e) => console.warn("Failed to load dynamic suggestions:", e));
  }, []);

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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter suggestions dynamically
  const filteredSuggestions = (() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) {
      return allSuggestions.slice(0, 7);
    }
    
    // Filter matching suggestions
    const matches = allSuggestions.filter((s) =>
      s.text.toLowerCase().includes(q)
    );

    // If query starts with "ใกล้" or custom search, build dynamic prompt suggestion if not present
    if (q.startsWith("ใกล้") && !matches.some((m) => m.text.toLowerCase() === q)) {
      const customPrompt: SuggestionItem = {
        text: inputValue.trim(),
        type: "landmark",
        label: "ค้นหาทำเลนี้",
      };
      return [customPrompt, ...matches].slice(0, 8);
    }

    return matches.slice(0, 8);
  })();

  const handleSelectSuggestion = (selectedText: string) => {
    setInputValue(selectedText);
    setKeyword(selectedText);
    setIsOpen(false);
  };

  const getIcon = (type: SuggestionItem["type"]) => {
    switch (type) {
      case "landmark":
        return <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />;
      case "transit":
        return <TrainTrack className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
      case "area":
        return <Building2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />;
      case "feature":
        return <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
      default:
        return <Compass className="h-3.5 w-3.5 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div ref={containerRef} className="relative group w-full">
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
              ? "ค้นหาทำเล, ใกล้เซ็นทรัลบางนา, BTS อารีย์..." 
              : language === "cn"
                ? "搜索地点 (例如: ใกล้ เซนทรัลบางนา, 阿里公寓)"
                : language === "ru"
                  ? "Поиск по местоположению (например: ใกล้ เซนทรัลบางนา)"
                  : "Search location, e.g. near Central Bangna, BTS Ari..."
          }
          className="border-none shadow-none focus-visible:ring-0 h-10! text-xs bg-transparent w-full font-medium placeholder:text-[12px] placeholder:text-slate-400/80"
          value={inputValue}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setIsOpen(false);
              setKeyword(inputValue);
            }
          }}
          disabled={false}
        />

        <div className="pr-1.5 flex items-center">
          {inputValue && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              onClick={() => {
                setInputValue("");
                setKeyword("");
                setIsOpen(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 🌟 Autocomplete Suggestions Dropdown */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 p-1.5 space-y-0.5">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-100 mb-1">
            <span>{inputValue ? "คำแนะนำการค้นหา" : "ทำเลยอดนิยม / คำค้นแนะนำ"}</span>
            <span className="text-indigo-600 font-normal">คลิกเพื่อเลือก</span>
          </div>

          {filteredSuggestions.map((item, idx) => (
            <button
              key={`${item.text}-${idx}`}
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-indigo-50/70 text-slate-700 hover:text-indigo-900 transition-all text-left font-medium group/item"
              onClick={() => handleSelectSuggestion(item.text)}
            >
              <div className="flex items-center gap-2.5 truncate">
                {getIcon(item.type)}
                <span className="truncate group-hover/item:font-semibold">
                  {item.text}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-100 group-hover/item:bg-indigo-100/70 group-hover/item:text-indigo-700 px-2 py-0.5 rounded-md font-semibold transition-colors shrink-0">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
