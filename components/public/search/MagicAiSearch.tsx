"use client";

import { useState, useEffect, useId, useRef, useMemo, useCallback } from "react";
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
  translations?: {
    th?: string;
    en?: string;
    cn?: string;
    ru?: string;
  };
}

const DEFAULT_SUGGESTIONS: SuggestionItem[] = [
  // 🏢 Popular Areas (Active with Listings)
  {
    text: "สุขุมวิท",
    type: "area",
    label: "ย่านยอดนิยม",
    translations: { th: "สุขุมวิท", en: "Sukhumvit", cn: "素坤逸", ru: "Сукхумвит" },
  },
  {
    text: "พระราม 9",
    type: "area",
    label: "ย่านยอดนิยม",
    translations: { th: "พระราม 9", en: "Rama 9", cn: "拉玛九", ru: "Рама 9" },
  },
  {
    text: "บางนา",
    type: "area",
    label: "ย่านยอดนิยม",
    translations: { th: "บางนา", en: "Bangna", cn: "邦纳", ru: "Банг На" },
  },
  {
    text: "อารีย์",
    type: "area",
    label: "ย่านยอดนิยม",
    translations: { th: "อารีย์", en: "Ari", cn: "阿里", ru: "Ари" },
  },
  {
    text: "ทองหล่อ",
    type: "area",
    label: "ย่านยอดนิยม",
    translations: { th: "ทองหล่อ", en: "Thong Lo", cn: "通罗", ru: "Тхонг Ло" },
  },
  {
    text: "เอกมัย",
    type: "area",
    label: "ย่านยอดนิยม",
    translations: { th: "เอกมัย", en: "Ekkamai", cn: "伊卡迈", ru: "Эккамай" },
  },
  {
    text: "อ่อนนุช",
    type: "area",
    label: "ย่านยอดนิยม",
    translations: { th: "อ่อนนุช", en: "On Nut", cn: "安努", ru: "Он Нут" },
  },
  {
    text: "รัชดา",
    type: "area",
    label: "ย่านยอดนิยม",
    translations: { th: "รัชดา", en: "Ratchada", cn: "拉差达", ru: "Ратчада" },
  },
  {
    text: "ปุณณวิถี",
    type: "area",
    label: "ย่านยอดนิยม",
    translations: { th: "ปุณณวิถี", en: "Punnawithi", cn: "普纳威提", ru: "Пуннавити" },
  },
  {
    text: "อุดมสุข",
    type: "area",
    label: "ย่านยอดนิยม",
    translations: { th: "อุดมสุข", en: "Udom Suk", cn: "乌多姆苏克", ru: "Удом Сук" },
  },

  // 🚆 Active BTS & MRT Stations
  {
    text: "ใกล้ BTS อารีย์",
    type: "transit",
    label: "รถไฟฟ้า BTS",
    translations: { th: "ใกล้ BTS อารีย์", en: "Near BTS Ari", cn: "近 BTS 阿里", ru: "Рядом с BTS Ари" },
  },
  {
    text: "ใกล้ BTS ทองหล่อ",
    type: "transit",
    label: "รถไฟฟ้า BTS",
    translations: { th: "ใกล้ BTS ทองหล่อ", en: "Near BTS Thong Lo", cn: "近 BTS 通罗", ru: "Рядом с BTS Тхонг Ло" },
  },
  {
    text: "ใกล้ BTS อ่อนนุช",
    type: "transit",
    label: "รถไฟฟ้า BTS",
    translations: { th: "ใกล้ BTS อ่อนนุช", en: "Near BTS On Nut", cn: "近 BTS 安努", ru: "Рядом с BTS Он Нут" },
  },
  {
    text: "ใกล้ BTS ปุณณวิถี",
    type: "transit",
    label: "รถไฟฟ้า BTS",
    translations: { th: "ใกล้ BTS ปุณณวิถี", en: "Near BTS Punnawithi", cn: "近 BTS 普纳威提", ru: "Рядом с BTS Пуннавити" },
  },
  {
    text: "ใกล้ BTS อุดมสุข",
    type: "transit",
    label: "รถไฟฟ้า BTS",
    translations: { th: "ใกล้ BTS อุดมสุข", en: "Near BTS Udom Suk", cn: "近 BTS 乌多姆苏克", ru: "Рядом с BTS Удом Сук" },
  },
  {
    text: "ใกล้ MRT พระราม 9",
    type: "transit",
    label: "รถไฟฟ้า MRT",
    translations: { th: "ใกล้ MRT พระราม 9", en: "Near MRT Rama 9", cn: "近 MRT 拉玛九", ru: "Рядом с MRT Рама 9" },
  },
  {
    text: "ใกล้ MRT เพชรบุรี",
    type: "transit",
    label: "รถไฟฟ้า MRT",
    translations: { th: "ใกล้ MRT เพชรบุรี", en: "Near MRT Phetchaburi", cn: "近 MRT 碧武里", ru: "Рядом с MRT Пхетчабури" },
  },
  {
    text: "ใกล้ MRT สามย่าน",
    type: "transit",
    label: "รถไฟฟ้า MRT",
    translations: { th: "ใกล้ MRT สามย่าน", en: "Near MRT Sam Yan", cn: "近 MRT 三养", ru: "Рядом с MRT Сам Ян" },
  },

  // ✨ Verified Features
  {
    text: "คอนโด เลี้ยงสัตว์ได้",
    type: "feature",
    label: "เงื่อนไขพิเศษ",
    translations: { th: "คอนโด เลี้ยงสัตว์ได้", en: "Pet Friendly Condo", cn: "可养宠物公寓", ru: "Дог/Кэт френдли кондо" },
  },
  {
    text: "คอนโดติดรถไฟฟ้า",
    type: "feature",
    label: "เงื่อนไขพิเศษ",
    translations: { th: "คอนโดติดรถไฟฟ้า", en: "Condo Near BTS/MRT", cn: "轻轨/地铁旁公寓", ru: "Кондо рядом с метро" },
  },
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

  const getSuggestionDisplayText = useCallback((item: SuggestionItem, lang: string) => {
    if (item.translations) {
      if (lang === "en" && item.translations.en) return item.translations.en;
      if (lang === "cn" && (item.translations.cn || item.translations.en)) return item.translations.cn || item.translations.en!;
      if (lang === "ru" && (item.translations.ru || item.translations.en)) return item.translations.ru || item.translations.en!;
      if (lang === "th" && item.translations.th) return item.translations.th;
    }
    return item.text;
  }, []);

  // Fetch verified suggestions from DB (strictly only projects, transits, areas with active properties)
  useEffect(() => {
    getDynamicSearchSuggestionsAction()
      .then((dynamicItems) => {
        if (dynamicItems && dynamicItems.length > 0) {
          const map = new Map<string, SuggestionItem>();
          for (const item of dynamicItems) {
            const rawText = item?.text;
            const txt = typeof rawText === "string" 
              ? rawText 
              : (rawText as any)?.th || (rawText as any)?.en || (rawText ? String(rawText) : "");
            if (txt && txt !== "[object Object]" && txt.trim()) {
              map.set(txt.toLowerCase().trim(), { ...item, text: txt.trim() });
            }
          }
          setAllSuggestions(Array.from(map.values()));
        }
      })
      .catch((e) => console.warn("Failed to load dynamic suggestions:", e));
  }, []);

  // Sync internal state if external keyword changes (e.g. clear filters)
  useEffect(() => {
    setInputValue(keyword);
  }, [keyword]);

  const handleExecuteSearch = (valToSearch?: string) => {
    const finalVal = typeof valToSearch === "string" ? valToSearch : inputValue;
    setIsOpen(false);
    setKeyword(finalVal.trim());
  };

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

  // Filter suggestions dynamically (Balanced showcase when empty, full search when typing)
  const filteredSuggestions = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    
    if (!q) {
      // 🌟 Balanced showcase across diverse categories when input is empty
      const projects = allSuggestions.filter((s) => s.label === "โครงการ").slice(0, 4);
      const areas = allSuggestions.filter((s) => s.type === "area" && s.label !== "โครงการ").slice(0, 4);
      const landmarks = allSuggestions.filter((s) => s.type === "landmark").slice(0, 3);
      const transits = allSuggestions.filter((s) => s.type === "transit").slice(0, 4);
      const features = allSuggestions.filter((s) => s.type === "feature").slice(0, 2);

      const combined = [...projects, ...areas, ...landmarks, ...transits, ...features];
      
      // If we don't have enough categorized items, fallback to top slice
      if (combined.length === 0) {
        return allSuggestions.slice(0, 15);
      }
      return combined;
    }
    
    // Filter & rank matching suggestions across all localized names
    const scoredMatches = allSuggestions
      .map((item: SuggestionItem) => {
        const textCandidates = [
          item.text,
          item.translations?.th,
          item.translations?.en,
          item.translations?.cn,
          item.translations?.ru,
        ]
          .filter((t): t is string => Boolean(t))
          .map((t) => t.toLowerCase());

        const isMatch = textCandidates.some((t) => t.includes(q));
        if (!isMatch) return null;

        let score = 0;
        // 1. Starts with query (Top Priority, e.g. "Chaiyapruek" for "cha") -> 100 pts
        if (textCandidates.some((t) => t.startsWith(q))) {
          score += 100;
        } 
        // 2. Word boundary starts with query (e.g. "The Palm Chaengwattana" or "ใกล้ Chai...") -> 80 pts
        else if (textCandidates.some((t) => t.includes(` ${q}`) || t.includes(`-${q}`) || t.includes(`(${q}`))) {
          score += 80;
        } 
        // 3. Middle match (e.g. "Phetchaburi" or "Ratchada") -> 20 pts
        else {
          score += 20;
        }

        // 4. Boost โครงการ (Projects) -> +35 pts
        if (item.label === "โครงการ") {
          score += 35;
        }
        // 5. Boost สถานีรถไฟฟ้า / ย่าน when exact prefix -> +10 pts
        if (item.type === "transit") {
          score += 15;
        }

        // Shorter texts get a slight boost over very long sentences
        score -= Math.min(item.text.length * 0.2, 10);

        return { item, score };
      })
      .filter((s): s is { item: SuggestionItem; score: number } => s !== null)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.item);

    // If query starts with "ใกล้" or "near" or custom search, build dynamic prompt suggestion if not present
    if ((q.startsWith("ใกล้") || q.startsWith("near") || q.startsWith("近")) && !scoredMatches.some((m) => m.text.toLowerCase() === q)) {
      const customPrompt: SuggestionItem = {
        text: inputValue.trim(),
        type: "landmark",
        label: "ค้นหาทำเลนี้",
        translations: {
          th: inputValue.trim(),
          en: inputValue.trim(),
          cn: inputValue.trim(),
          ru: inputValue.trim(),
        },
      };
      return [customPrompt, ...scoredMatches].slice(0, 25);
    }

    return scoredMatches.slice(0, 25);
  }, [allSuggestions, inputValue]);

  const handleSelectSuggestion = (item: SuggestionItem) => {
    const localizedText = getSuggestionDisplayText(item, language);
    setInputValue(localizedText);
    handleExecuteSearch(localizedText);
  };

  const getIcon = (type: SuggestionItem["type"], label: string) => {
    if (label === "โครงการ") {
      return <Building2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />;
    }
    switch (type) {
      case "landmark":
        return <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />;
      case "transit":
        return <TrainTrack className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
      case "area":
        return <Compass className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
      case "feature":
        return <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
      default:
        return <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />;
    }
  };

  const getBadgeStyle = (type: SuggestionItem["type"], label: string) => {
    if (label === "โครงการ") {
      return "bg-indigo-50 text-indigo-700 group-hover/item:bg-indigo-100";
    }
    switch (type) {
      case "landmark":
        return "bg-rose-50 text-rose-700 group-hover/item:bg-rose-100";
      case "transit":
        return "bg-emerald-50 text-emerald-700 group-hover/item:bg-emerald-100";
      case "area":
        return "bg-blue-50 text-blue-700 group-hover/item:bg-blue-100";
      case "feature":
        return "bg-amber-50 text-amber-700 group-hover/item:bg-amber-100";
      default:
        return "bg-slate-100 text-slate-600 group-hover/item:bg-slate-200";
    }
  };

  const getLocalizedBadge = (label: string, lang: string) => {
    if (label === "โครงการ") {
      if (lang === "en") return "Project";
      if (lang === "cn") return "项目";
      if (lang === "ru") return "Проект";
      return "โครงการ";
    }
    if (label === "ย่านยอดนิยม") {
      if (lang === "en") return "Popular Area";
      if (lang === "cn") return "热门区域";
      if (lang === "ru") return "Популярный район";
      return "ย่านยอดนิยม";
    }
    if (label === "ทำเลใกล้เคียง" || label === "สถานที่ใกล้เคียง") {
      if (lang === "en") return "Nearby";
      if (lang === "cn") return "附近地标";
      if (lang === "ru") return "Рядом";
      return "สถานที่ใกล้เคียง";
    }
    if (label === "รถไฟฟ้า") {
      if (lang === "en") return "Transit";
      if (lang === "cn") return "轨道交通";
      if (lang === "ru") return "Метро";
      return "รถไฟฟ้า";
    }
    if (label === "สถานีรถไฟฟ้า") {
      if (lang === "en") return "Station";
      if (lang === "cn") return "地铁站";
      if (lang === "ru") return "Станция";
      return "สถานีรถไฟฟ้า";
    }
    if (label === "เงื่อนไขพิเศษ") {
      if (lang === "en") return "Feature";
      if (lang === "cn") return "特色";
      if (lang === "ru") return "Особенность";
      return "เงื่อนไขพิเศษ";
    }
    if (label === "ค้นหาทำเลนี้") {
      if (lang === "en") return "Search Location";
      if (lang === "cn") return "搜索此地点";
      if (lang === "ru") return "Искать локацию";
      return "ค้นหาทำเลนี้";
    }
    return label;
  };

  const getHeaderTitle = (hasInput: boolean, lang: string) => {
    if (hasInput) {
      if (lang === "en") return "Search Suggestions";
      if (lang === "cn") return "搜索建议";
      if (lang === "ru") return "Рекомендации";
      return "คำแนะนำการค้นหา";
    }
    if (lang === "en") return "Popular Searches & Projects";
    if (lang === "cn") return "热门搜索与项目";
    if (lang === "ru") return "Популярные районы и проекты";
    return "ทำเลยอดนิยม และโครงการแนะนำ";
  };

  const getClickToSelectText = (lang: string) => {
    if (lang === "en") return "Click to select";
    if (lang === "cn") return "点击选择";
    if (lang === "ru") return "Нажмите для выбора";
    return "คลิกเพื่อเลือก";
  };

  const getSearchButtonLabel = (lang: string) => {
    if (lang === "en") return "Search";
    if (lang === "cn") return "搜索";
    if (lang === "ru") return "Поиск";
    return "ค้นหา";
  };

  return (
    <div ref={containerRef} className="relative group w-full">
      <div className="relative flex items-center bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 p-1 pl-3.5">
        {/* [PREMIUM LOADING BAR] */}
        {globalLoading && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-100 overflow-hidden z-50">
            <div className="h-full bg-indigo-500 animate-loading-bar shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          </div>
        )}

        <div className="text-slate-400 shrink-0">
          <Search className="h-4 w-4" />
        </div>
        
        <Input
          id={searchId}
          name="keyword"
          placeholder={
            language === "th" 
              ? "ค้นหาทำเล, โครงการ, ใกล้เซ็นทรัลบางนา, BTS อารีย์..." 
              : language === "cn"
                ? "搜索地点、项目 (例如: 近 素坤逸, 阿里, Oka Haus)"
                : language === "ru"
                  ? "Поиск по местоположению, проекту (например: Рядом с Сукхумвит)"
                  : "Search location, project, e.g. Near Sukhumvit, BTS Ari, Oka Haus..."
          }
          className="border-none shadow-none focus-visible:ring-0 h-9! text-xs bg-transparent w-full font-medium placeholder:text-[12px] placeholder:text-slate-400/80 px-2"
          value={inputValue}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleExecuteSearch();
            }
          }}
          disabled={false}
        />

        <div className="flex items-center gap-1 shrink-0">
          {inputValue && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              onClick={() => {
                setInputValue("");
                handleExecuteSearch("");
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* 🔍 Dedicated Search Button */}
          <button
            type="button"
            onClick={() => handleExecuteSearch()}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer shrink-0 ${
              inputValue.trim()
                ? "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white shadow-sm shadow-blue-500/25 ring-2 ring-indigo-500/20"
                : "bg-slate-100/90 hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 border border-slate-200/60 shadow-none"
            }`}
          >
            <Search className={`h-3 w-3 ${inputValue.trim() ? "text-white" : "text-slate-400"}`} />
            <span>{getSearchButtonLabel(language)}</span>
          </button>
        </div>
      </div>

      {/* 🌟 Autocomplete Suggestions Dropdown (Scrollable & Categorized) */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 p-1.5 flex flex-col">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between gap-2 border-b border-slate-100 mb-1 shrink-0 whitespace-nowrap">
            <span className="truncate">{getHeaderTitle(Boolean(inputValue), language)}</span>
            <span className="text-indigo-600 font-normal shrink-0 whitespace-nowrap">{getClickToSelectText(language)}</span>
          </div>

          <div className="max-h-[340px] overflow-y-auto overscroll-contain pr-0.5 space-y-0.5">
            {filteredSuggestions.map((item: SuggestionItem, idx: number) => {
              const displayTitle = getSuggestionDisplayText(item, language);
              return (
                <button
                  key={`${item.text}-${item.type}-${idx}`}
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-indigo-50/70 text-slate-700 hover:text-indigo-900 transition-all text-left font-medium group/item"
                  onClick={() => handleSelectSuggestion(item)}
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    {getIcon(item.type, item.label)}
                    <span className="truncate group-hover/item:font-semibold">
                      {displayTitle}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors shrink-0 ${getBadgeStyle(item.type, item.label)}`}>
                    {getLocalizedBadge(item.label, language)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
