"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Building2, 
  MapPin, 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  ArrowDownAZ,
  ArrowDownWideNarrow,
  X, 
  ChevronLeft, 
  ChevronRight,
  ArrowLeft,
  Home,
  Map as MapIcon,
  Store,
  Briefcase,
  Warehouse,
  Compass,
  Sparkles,
  HelpCircle
} from "lucide-react";
import type { PublicProject } from "@/features/public/projects";
import { getProvinceName, translateLocation } from "@/lib/utils/provinces";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { m, AnimatePresence } from "framer-motion";

interface ProjectsHubClientProps {
  initialProjects: PublicProject[];
  language: string;
  translations: Record<string, Record<string, string>>;
}

const CLIENT_LOCALIZATION: Record<string, Record<string, string>> = {
  search_placeholder: {
    th: "ค้นหาด้วยชื่อโครงการ หรือผู้พัฒนา...",
    en: "Search by project name or developer...",
    cn: "搜索楼盘名称或开发商...",
    ru: "Поиск по названию или застройщику...",
  },
  filter_all_areas: {
    th: "ทุกย่าน/ทำเล",
    en: "All Areas",
    cn: "所有区域",
    ru: "Все районы",
  },
  sort_by: {
    th: "จัดเรียงตาม",
    en: "Sort By",
    cn: "排序方式",
    ru: "Сортировка",
  },
  sort_default: {
    th: "แนะนำ / เริ่มต้น",
    en: "Recommended",
    cn: "推荐",
    ru: "Рекомендуемые",
  },
  sort_price_low: {
    th: "ราคาเริ่มต้น: ต่ำ - สูง",
    en: "Price: Low to High",
    cn: "价格：从低到高",
    ru: "Цена: по возрастанию",
  },
  sort_units_high: {
    th: "จำนวนห้องว่าง: มาก - น้อย",
    en: "Available Rooms: High to Low",
    cn: "房源数量：从多到少",
    ru: "Комнат в наличии: по убыванию",
  },
  sort_name_az: {
    th: "ชื่อโครงการ A - Z",
    en: "Name: A - Z",
    cn: "名称：A - Z",
    ru: "Название: А - Я",
  },
  no_projects_found: {
    th: "ไม่พบโครงการที่ตรงกับเงื่อนไขการค้นหาของคุณ",
    en: "No projects match your search criteria.",
    cn: "没有找到符合您搜索条件的楼盘项目。",
    ru: "Проекты, соответствующие вашему запросу, не найдены.",
  },
  clear_filters: {
    th: "ล้างตัวกรองทั้งหมด",
    en: "Clear All Filters",
    cn: "清除所有筛选",
    ru: "Сбросить фильтры",
  },
  popular_areas_title: {
    th: "เลือกตามย่านทำเล",
    en: "Browse by Area",
    cn: "按区域浏览",
    ru: "Популярные районы",
  },
  filter_property_type: {
    th: "ประเภทโครงการ",
    en: "Project Type",
    cn: "项目类型",
    ru: "Тип проекта",
  },
  filter_all_provinces: {
    th: "ทุกจังหวัด",
    en: "All Provinces",
    cn: "所有省份",
    ru: "Все провинции",
  },
  filter_province: {
    th: "จังหวัด",
    en: "Province",
    cn: "省份",
    ru: "Провинция",
  },
  confirm: {
    th: "ตกลง",
    en: "Apply",
    cn: "确定",
    ru: "Применить",
  },
  filter_developer: {
    th: "ผู้พัฒนาโครงการ",
    en: "Developer",
    cn: "开发商",
    ru: "Застройщик",
  },
  filter_all_developers: {
    th: "ผู้พัฒนาทั้งหมด",
    en: "All Developers",
    cn: "所有开发商",
    ru: "Все застройщики",
  }
};

const PROJECT_PROPERTY_TYPES = [
  { value: "ALL", icon: Compass, iconBg: "bg-slate-50 text-slate-500", label: { th: "ทุกประเภทโครงการ", en: "All Project Types", cn: "所有项目类型", ru: "Все типы проектов" } },
  { value: "1", icon: Building2, iconBg: "bg-blue-50 text-blue-600", label: { th: "คอนโดมิเนียม", en: "Condominium", cn: "公寓", ru: "Кондоминиум" } },
  { value: "2", icon: Home, iconBg: "bg-emerald-50 text-emerald-600", label: { th: "บ้านเดี่ยว", en: "House", cn: "独栋别墅", ru: "Отдельный дом" } },
  { value: "3", icon: Home, iconBg: "bg-teal-50 text-teal-600", label: { th: "ทาวน์โฮม", en: "Townhome", cn: "联排别墅", ru: "Таунхаус" } },
  { value: "4", icon: MapIcon, iconBg: "bg-amber-50 text-amber-605", label: { th: "ที่ดิน", en: "Land", cn: "土地", ru: "Земля" } },
  { value: "5", icon: Store, iconBg: "bg-rose-50 text-rose-600", label: { th: "อาคารพาณิชย์", en: "Commercial Building", cn: "商业楼宇", ru: "Коммерческое здание" } },
  { value: "8", icon: Sparkles, iconBg: "bg-violet-50 text-violet-600", label: { th: "วิลล่า", en: "Villa", cn: "独栋วิลล่า", ru: "Вилла" } },
  { value: "9", icon: Sparkles, iconBg: "bg-purple-50 text-purple-600", label: { th: "พูลวิลล่า", en: "Pool Villa", cn: "泳池别墅", ru: "Вилла с бассейном" } },
  { value: "7", icon: Briefcase, iconBg: "bg-indigo-50 text-indigo-600", label: { th: "อาคารสำนักงาน", en: "Office Building", cn: "写字楼", ru: "Офисное здание" } },
  { value: "6", icon: Warehouse, iconBg: "bg-cyan-50 text-cyan-600", label: { th: "โกดัง / โรงงาน", en: "Warehouse", cn: "仓库/工厂", ru: "Склад / Фабрика" } },
  { value: "10", icon: HelpCircle, iconBg: "bg-slate-100 text-slate-600", label: { th: "อื่นๆ", en: "Other", cn: "其他", ru: "Другое" } },
];

function formatPrice(amount: number, lang: string): string {
  if (amount >= 1000000) {
    const value = amount / 1000000;
    const formatted = value.toFixed(1).replace(/\.0$/, "");
    return lang === "th" ? `${formatted} ล้าน` : `${formatted}M`;
  }
  return new Intl.NumberFormat(lang === "th" ? "th-TH" : "en-US", {
    maximumFractionDigits: 0,
  }).format(amount);
}

function normalizeProvince(prov: string): string {
  const p = prov.trim();
  const lower = p.toLowerCase();
  if (lower === "bangkok" || lower === "กรุงเทพ" || lower === "กรุงเทพฯ") return "กรุงเทพมหานคร";
  if (lower === "samut prakan" || lower === "samutprakan") return "สมุทรปราการ";
  if (lower === "nonthaburi") return "นนทบุรี";
  if (lower === "pathum thani" || lower === "pathumthani") return "ปทุมธานี";
  if (lower === "chonburi" || lower === "chon buri") return "ชลบุรี";
  if (lower === "phuket") return "ภูเก็ต";
  return p;
}

const getProvinceColor = (prov: string): { bg: string; text: string } => {
  const p = prov.trim();
  const lower = p.toLowerCase();
  if (lower === "กรุงเทพมหานคร" || lower === "bangkok") {
    return { bg: "bg-blue-50", text: "text-blue-600" };
  }
  if (lower === "นนทบุรี" || lower === "nonthaburi") {
    return { bg: "bg-purple-50", text: "text-purple-600" };
  }
  if (lower === "ปทุมธานี" || lower === "pathum thani" || lower === "pathumthani") {
    return { bg: "bg-amber-50", text: "text-amber-600" };
  }
  if (lower === "สมุทรปราการ" || lower === "samut prakan" || lower === "samutprakan") {
    return { bg: "bg-emerald-50", text: "text-emerald-650" };
  }
  if (lower === "ชลบุรี" || lower === "chonburi" || lower === "chon buri") {
    return { bg: "bg-teal-50", text: "text-teal-600" };
  }
  if (lower === "ภูเก็ต" || lower === "phuket") {
    return { bg: "bg-rose-50", text: "text-rose-600" };
  }
  // Alternating colors
  const colors = [
    { bg: "bg-indigo-50", text: "text-indigo-600" },
    { bg: "bg-orange-50", text: "text-orange-605" },
    { bg: "bg-cyan-50", text: "text-cyan-600" },
    { bg: "bg-pink-50", text: "text-pink-600" }
  ];
  let sum = 0;
  for (let i = 0; i < p.length; i++) {
    sum += p.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring" as const, 
      stiffness: 100, 
      damping: 15,
    } 
  },
};

export function ProjectsHubClient({
  initialProjects,
  language,
  translations,
}: ProjectsHubClientProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<string>("ALL");
  const [selectedProvince, setSelectedProvince] = React.useState<string>("ALL");
  const [selectedArea, setSelectedArea] = React.useState<string>("ALL");
  const [selectedDeveloper, setSelectedDeveloper] = React.useState<string>("ALL");
  const [sortBy, setSortBy] = React.useState<"DEFAULT" | "PRICE_LOW" | "UNITS_HIGH" | "NAME_AZ">("DEFAULT");
  const [isTypeDialogOpen, setIsTypeDialogOpen] = React.useState(false);
  const [isProvinceDialogOpen, setIsProvinceDialogOpen] = React.useState(false);
  const [isAreaDialogOpen, setIsAreaDialogOpen] = React.useState(false);
  const [isDeveloperDialogOpen, setIsDeveloperDialogOpen] = React.useState(false);
  const [isSortDialogOpen, setIsSortDialogOpen] = React.useState(false);

  const getPageString = (key: string, params?: Record<string, string | number>) => {
    let val = translations[key]?.[language] || CLIENT_LOCALIZATION[key]?.[language] || translations[key]?.th || CLIENT_LOCALIZATION[key]?.th || "";
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, String(v));
      });
    }
    return val;
  };

  // Extract unique provinces dynamically from projects
  const provinces = React.useMemo(() => {
    const provSet = new Set<string>();
    initialProjects.forEach((p) => {
      if (p.province) {
        provSet.add(normalizeProvince(p.province));
      }
    });
    return Array.from(provSet).sort((a, b) => a.localeCompare(b, "th"));
  }, [initialProjects]);

  // Compute project count for each province dynamically based on other active filters
  const provinceCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    initialProjects.forEach((p) => {
      if (!p.province) return;

      const matchesType = selectedType === "ALL" || p.propertyType === Number(selectedType);
      const matchesArea = selectedArea === "ALL" || p.popularArea?.trim() === selectedArea;
      const matchesDeveloper = selectedDeveloper === "ALL" || p.developer?.trim() === selectedDeveloper;
      
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameTh = (p.name.th || "").toLowerCase();
        const nameEn = (p.name.en || "").toLowerCase();
        const dev = (p.developer || "").toLowerCase();
        matchesSearch = nameTh.includes(q) || nameEn.includes(q) || dev.includes(q);
      }

      if (matchesType && matchesArea && matchesDeveloper && matchesSearch) {
        const norm = normalizeProvince(p.province);
        counts[norm] = (counts[norm] || 0) + 1;
      }
    });
    return counts;
  }, [initialProjects, selectedType, selectedArea, selectedDeveloper, searchQuery]);

  // Compute project count for each property type dynamically based on other active filters
  const typeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    initialProjects.forEach((p) => {
      const normProv = p.province ? normalizeProvince(p.province) : "";
      const matchesProvince = selectedProvince === "ALL" || normProv === selectedProvince;
      const matchesArea = selectedArea === "ALL" || p.popularArea?.trim() === selectedArea;
      const matchesDeveloper = selectedDeveloper === "ALL" || p.developer?.trim() === selectedDeveloper;
      
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameTh = (p.name.th || "").toLowerCase();
        const nameEn = (p.name.en || "").toLowerCase();
        const dev = (p.developer || "").toLowerCase();
        matchesSearch = nameTh.includes(q) || nameEn.includes(q) || dev.includes(q);
      }

      if (matchesProvince && matchesArea && matchesDeveloper && matchesSearch) {
        const typeStr = String(p.propertyType);
        counts[typeStr] = (counts[typeStr] || 0) + 1;
      }
    });
    return counts;
  }, [initialProjects, selectedProvince, selectedArea, selectedDeveloper, searchQuery]);

  const totalProjectsInProvince = React.useMemo(() => {
    return initialProjects.filter((p) => {
      const normProv = p.province ? normalizeProvince(p.province) : "";
      const matchesProvince = selectedProvince === "ALL" || normProv === selectedProvince;
      const matchesArea = selectedArea === "ALL" || p.popularArea?.trim() === selectedArea;
      const matchesDeveloper = selectedDeveloper === "ALL" || p.developer?.trim() === selectedDeveloper;
      
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameTh = (p.name.th || "").toLowerCase();
        const nameEn = (p.name.en || "").toLowerCase();
        const dev = (p.developer || "").toLowerCase();
        matchesSearch = nameTh.includes(q) || nameEn.includes(q) || dev.includes(q);
      }
      return matchesProvince && matchesArea && matchesDeveloper && matchesSearch;
    }).length;
  }, [initialProjects, selectedProvince, selectedArea, selectedDeveloper, searchQuery]);

  const sortedPropertyTypes = React.useMemo(() => {
    const allOption = PROJECT_PROPERTY_TYPES.find((t) => t.value === "ALL")!;
    const otherOptions = PROJECT_PROPERTY_TYPES.filter((t) => t.value !== "ALL");
    const sortedOthers = [...otherOptions].sort((a, b) => {
      const countA = typeCounts[a.value] || 0;
      const countB = typeCounts[b.value] || 0;
      return countB - countA;
    });
    return [allOption, ...sortedOthers];
  }, [typeCounts]);

  // Extract unique developers dynamically from projects
  const developers = React.useMemo(() => {
    const devSet = new Set<string>();
    initialProjects.forEach((p) => {
      if (p.developer) {
        devSet.add(p.developer.trim());
      }
    });
    return Array.from(devSet).sort((a, b) => a.localeCompare(b, "th"));
  }, [initialProjects]);

  // Compute project count for each developer dynamically based on other active filters
  const developerCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    initialProjects.forEach((p) => {
      const normProv = p.province ? normalizeProvince(p.province) : "";
      const matchesProvince = selectedProvince === "ALL" || normProv === selectedProvince;
      const matchesType = selectedType === "ALL" || p.propertyType === Number(selectedType);
      const matchesArea = selectedArea === "ALL" || p.popularArea?.trim() === selectedArea;
      
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameTh = (p.name.th || "").toLowerCase();
        const nameEn = (p.name.en || "").toLowerCase();
        const dev = (p.developer || "").toLowerCase();
        matchesSearch = nameTh.includes(q) || nameEn.includes(q) || dev.includes(q);
      }
      
      if (p.developer && matchesProvince && matchesType && matchesArea && matchesSearch) {
        const dev = p.developer.trim();
        counts[dev] = (counts[dev] || 0) + 1;
      }
    });
    return counts;
  }, [initialProjects, selectedProvince, selectedType, selectedArea, searchQuery]);

  // Sort developers by active count descending
  const sortedDevelopers = React.useMemo(() => {
    return [...developers].sort((a, b) => {
      const countA = developerCounts[a] || 0;
      const countB = developerCounts[b] || 0;
      return countB - countA;
    });
  }, [developers, developerCounts]);

  // Extract unique popular areas dynamically from projects with count of projects in each area (filtered by other active filters)
  const popularAreas = React.useMemo(() => {
    const areaMap = new Map<string, { th: string; lang: string; count: number }>();
    initialProjects.forEach((p) => {
      const normProv = p.province ? normalizeProvince(p.province) : "";
      const matchesProvince = selectedProvince === "ALL" || normProv === selectedProvince;
      const matchesType = selectedType === "ALL" || p.propertyType === Number(selectedType);
      const matchesDeveloper = selectedDeveloper === "ALL" || p.developer?.trim() === selectedDeveloper;
      
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameTh = (p.name.th || "").toLowerCase();
        const nameEn = (p.name.en || "").toLowerCase();
        const dev = (p.developer || "").toLowerCase();
        matchesSearch = nameTh.includes(q) || nameEn.includes(q) || dev.includes(q);
      }

      if (p.popularArea && matchesProvince && matchesType && matchesDeveloper && matchesSearch) {
        const areaTh = p.popularArea.trim();
        const rawLang = (
          language === "en" ? p.popularAreaEn :
          language === "cn" ? p.popularAreaCn :
          language === "ru" ? p.popularAreaRu :
          p.popularArea
        );
        const areaLang = (language !== "th" && rawLang && rawLang === p.popularArea)
          ? (translateLocation(rawLang, language) || rawLang)
          : (rawLang || (language !== "th" ? translateLocation(areaTh, language) : areaTh));
        
        const existing = areaMap.get(areaTh) || { th: areaTh, lang: areaLang, count: 0 };
        existing.count += 1;
        areaMap.set(areaTh, existing);
      }
    });
    return Array.from(areaMap.values()).sort((a: any, b: any) => a.lang.localeCompare(b.lang, language));
  }, [initialProjects, language, selectedProvince, selectedType, selectedDeveloper, searchQuery]);

  // Filter & Sort Logic
  const filteredAndSortedProjects = React.useMemo(() => {
    let result = [...initialProjects];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const nameTh = (p.name.th || "").toLowerCase();
        const nameEn = (p.name.en || "").toLowerCase();
        const dev = (p.developer || "").toLowerCase();
        return nameTh.includes(q) || nameEn.includes(q) || dev.includes(q);
      });
    }

    // 2. Property Type Filter
    if (selectedType !== "ALL") {
      result = result.filter((p) => p.propertyType === Number(selectedType));
    }

    // 3. Province Filter
    if (selectedProvince !== "ALL") {
      result = result.filter((p) => p.province && normalizeProvince(p.province) === selectedProvince);
    }

    // 4. Popular Area Filter
    if (selectedArea !== "ALL") {
      result = result.filter((p) => p.popularArea?.trim() === selectedArea);
    }

    // 4.5 Developer Filter
    if (selectedDeveloper !== "ALL") {
      result = result.filter((p) => p.developer?.trim() === selectedDeveloper);
    }

    // 5. Sorting
    if (sortBy === "DEFAULT") {
      result.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        }
        return b.propertyCount - a.propertyCount;
      });
    } else if (sortBy === "PRICE_LOW") {
      result.sort((a, b) => {
        const priceA = a.priceMin ?? a.rentalMin ?? Infinity;
        const priceB = b.priceMin ?? b.rentalMin ?? Infinity;
        return priceA - priceB;
      });
    } else if (sortBy === "UNITS_HIGH") {
      result.sort((a, b) => b.propertyCount - a.propertyCount);
    } else if (sortBy === "NAME_AZ") {
      result.sort((a, b) => {
        const nameA = a.name[language as keyof typeof a.name] || a.name.th;
        const nameB = b.name[language as keyof typeof b.name] || b.name.th;
        return nameA.localeCompare(nameB, language);
      });
    }

    return result;
  }, [initialProjects, searchQuery, selectedType, selectedProvince, selectedArea, selectedDeveloper, sortBy, language]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedType("ALL");
    setSelectedProvince("ALL");
    setSelectedArea("ALL");
    setSelectedDeveloper("ALL");
    setSortBy("DEFAULT");
  };

  const selectedTypeObj = PROJECT_PROPERTY_TYPES.find((t) => t.value === selectedType);
  const selectedTypeLabel = selectedTypeObj ? (selectedTypeObj.label[language as keyof typeof selectedTypeObj.label] || selectedTypeObj.label.th) : "";

  const getSubtitleText = (count: number) => {
    const provName = selectedProvince === "ALL" 
      ? (language === "th" ? "กรุงเทพฯ และปริมณฑล" : language === "en" ? "Bangkok & Vicinity" : selectedProvince)
      : getProvinceName(selectedProvince, language);

    if (language === "en") {
      return `Explore ${count} premier condominium and residential projects in ${provName}`;
    }
    if (language === "cn") {
      return `汇聚${provName}地区共 ${count} 个优质公寓及住宅项目`;
    }
    if (language === "ru") {
      return `Исследуйте ${count} жилых комплексов и проектов в ${provName}`;
    }
    return `รวมคอนโดมิเนียมและโครงการบ้านเด่น ${count} โครงการใน${provName}`;
  };

  return (
    <>
      {/* Hero Section - Dynamically updates subtitle with province and project count */}
      <section className="relative overflow-hidden pt-20 pb-10 md:pt-32 md:pb-24 text-white bg-slate-950">
        {/* Background Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-80 blur-xs scale-105 duration-1000 select-none pointer-events-none"
          style={{ backgroundImage: `url('/images/hero-projects.png')` }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />
        
        {/* Decorative Light Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-screen-2xl mx-auto px-5 md:px-8 z-10">
          <nav aria-label="breadcrumb" className="mb-4 md:mb-8">
            <ol className="hidden lg:flex items-center gap-2 text-xs text-slate-400 bg-white/10 px-4 py-2 rounded-full border border-white/10 w-fit">
              <li><Link href="/" className="hover:text-white transition-colors">{getPageString("breadcrumb_home")}</Link></li>
              <li><ChevronRight className="w-3.5 h-3.5 opacity-60 text-slate-500" /></li>
              <li className="text-slate-200 font-bold">{getPageString("breadcrumb_projects")}</li>
            </ol>
            <div className="block lg:hidden">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/20 shadow-2xs active:scale-95 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{getPageString("breadcrumb_home")}</span>
              </Link>
            </div>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="hidden md:flex p-5 rounded-3xl bg-linear-to-tr from-blue-600/30 to-indigo-600/30 border border-white/10 shrink-0 shadow-2xl shadow-blue-500/5">
              <Building2 className="w-12 h-12 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-md leading-tight md:leading-none bg-linear-to-r from-white via-white to-slate-300 bg-clip-text text-transparent">
                {getPageString("title")}
              </h1>
              <p className="text-xs sm:text-sm md:text-lg text-slate-300 mt-2 md:mt-3.5 font-medium max-w-2xl leading-relaxed">
                {getSubtitleText(filteredAndSortedProjects.length)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Controls Container - Sticky & Refined */}
      <section className="sticky top-[62px] z-30 w-full bg-white/90 border-b border-slate-200/85 shadow-xs">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 space-y-2.5">
          
          {/* Row 1: Search Bar + Sort Dropdown */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Search Input */}
            <div className="relative flex-1 group">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-450 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getPageString("search_placeholder")}
                className="w-full h-11 pl-10 pr-9 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50/80 focus:border-blue-500 transition-all font-medium text-xs text-slate-800 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3.5 p-0.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort By ResponsiveDialog */}
            <div className="relative shrink-0">
              {(() => {
                const sortOptionConfigs = {
                  DEFAULT: {
                    icon: Sparkles,
                    label: getPageString("sort_default"),
                    bg: "bg-amber-50 text-amber-600",
                  },
                  PRICE_LOW: {
                    icon: ArrowDownWideNarrow,
                    label: getPageString("sort_price_low"),
                    bg: "bg-emerald-50 text-emerald-600",
                  },
                  UNITS_HIGH: {
                    icon: Building2,
                    label: getPageString("sort_units_high"),
                    bg: "bg-blue-50 text-blue-600",
                  },
                  NAME_AZ: {
                    icon: ArrowDownAZ,
                    label: getPageString("sort_name_az"),
                    bg: "bg-purple-50 text-purple-600",
                  },
                } as const;

                const currentSortConfig = sortOptionConfigs[sortBy] || sortOptionConfigs.DEFAULT;
                const CurrentSortIcon = currentSortConfig.icon;

                return (
                  <ResponsiveDialog
                    open={isSortDialogOpen}
                    onOpenChange={setIsSortDialogOpen}
                    title={getPageString("sort_by")}
                    trigger={
                      <Button
                        variant="outline"
                        aria-label={getPageString("sort_by")}
                        className="h-11! w-11 sm:w-auto px-0 sm:px-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-350 hover:shadow-xs text-xs font-bold text-slate-700 flex items-center justify-center sm:justify-start gap-2 cursor-pointer shrink-0"
                      >
                        <div className={`p-1 rounded-md shrink-0 transition-colors ${currentSortConfig.bg}`}>
                          <CurrentSortIcon className="h-4 w-4" />
                        </div>
                        <span className="hidden sm:inline">
                          {currentSortConfig.label}
                        </span>
                      </Button>
                    }
                  >
                    <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(Object.keys(sortOptionConfigs) as Array<keyof typeof sortOptionConfigs>).map((key) => {
                          const opt = sortOptionConfigs[key];
                          const Icon = opt.icon;
                          const isSelected = sortBy === key;
                          return (
                            <button
                              key={key}
                              onClick={() => {
                                setSortBy(key as any);
                                setIsSortDialogOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs transition-all border flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? "bg-blue-50/80 border-blue-200 text-blue-600 shadow-xs"
                                  : "border-slate-100 hover:bg-slate-50 text-slate-600"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg shrink-0 ${opt.bg}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span>{opt.label}</span>
                              </div>
                              {isSelected && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </ResponsiveDialog>
                );
              })()}
            </div>
          </div>

          {/* Row 2: Filter Pills (Horizontal Scroll on Mobile / Wrapped on Desktop) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 w-full">
            {/* 1. Province Selector Dialog */}
            {provinces.length > 0 && (
              <ResponsiveDialog
                open={isProvinceDialogOpen}
                onOpenChange={setIsProvinceDialogOpen}
                title={getPageString("filter_province")}
                trigger={
                  <Button
                    variant="outline"
                    className="h-9 px-3.5 rounded-xl border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700! font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all shrink-0 whitespace-nowrap"
                  >
                    <div className={`p-0.5 rounded shrink-0 ${
                      selectedProvince === "ALL" 
                        ? "text-red-550" 
                        : `${getProvinceColor(selectedProvince).text}`
                    }`}>
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <span>
                      {selectedProvince === "ALL" 
                        ? getPageString("filter_all_provinces") 
                        : getProvinceName(selectedProvince, language)}
                    </span>
                  </Button>
                }
              >
                <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {/* All Provinces Option */}
                    <button
                      onClick={() => {
                        setSelectedProvince("ALL");
                        setSelectedArea("ALL");
                        setIsProvinceDialogOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs transition-all border flex items-center justify-between ${
                        selectedProvince === "ALL"
                          ? "bg-blue-50/80 border-blue-200 text-blue-600 shadow-xs"
                          : "border-slate-100 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-50 text-red-500 shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span>
                          {getPageString("filter_all_provinces")}
                          <span className="text-[10px] opacity-60 font-medium ml-1">({initialProjects.length})</span>
                        </span>
                      </div>
                      {selectedProvince === "ALL" && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                      )}
                    </button>

                    {/* Individual Provinces */}
                    {provinces.map((prov) => {
                      const isSelected = selectedProvince === prov;
                      const labelText = getProvinceName(prov, language);
                      const provColor = getProvinceColor(prov);
                      const count = provinceCounts[prov] || 0;
                      const isDisabled = count === 0;
                      return (
                        <button
                          key={prov}
                          onClick={() => {
                            setSelectedProvince(prov);
                            setSelectedArea("ALL");
                            setIsProvinceDialogOpen(false);
                          }}
                          disabled={isDisabled}
                          className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs transition-all border flex items-center justify-between ${
                            isSelected
                              ? "bg-blue-50/80 border-blue-200 text-blue-600 shadow-xs"
                              : isDisabled
                                ? "border-slate-100 bg-slate-50/40 text-slate-350 cursor-not-allowed opacity-50 pointer-events-none"
                                : "border-slate-100 hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg shrink-0 ${provColor.bg} ${provColor.text} ${isDisabled ? "opacity-40" : ""}`}>
                              <MapPin className="w-4 h-4" />
                            </div>
                            <span>
                              {labelText}
                              <span className="text-[10px] opacity-60 font-medium ml-1">({count})</span>
                            </span>
                          </div>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </ResponsiveDialog>
            )}

            {/* 2. Area Selector Dialog */}
            {popularAreas.length > 0 && (
              <ResponsiveDialog
                open={isAreaDialogOpen}
                onOpenChange={setIsAreaDialogOpen}
                title={getPageString("popular_areas_title")}
                trigger={
                  <Button
                    variant="outline"
                    className="h-9 px-3.5 rounded-xl border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700! font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all shrink-0 whitespace-nowrap"
                  >
                    <div className="p-0.5 text-amber-600 shrink-0">
                      <Compass className="h-3.5 w-3.5" />
                    </div>
                    <span>
                      {selectedArea === "ALL"
                        ? getPageString("filter_all_areas")
                        : (popularAreas.find((a: any) => a.th === selectedArea)?.lang || selectedArea)}
                    </span>
                  </Button>
                }
              >
                <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {/* All Areas Option */}
                    <button
                      onClick={() => {
                        setSelectedArea("ALL");
                        setIsAreaDialogOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs transition-all border flex items-center justify-between ${
                        selectedArea === "ALL"
                          ? "bg-blue-50/80 border-blue-200 text-blue-600 shadow-xs"
                          : "border-slate-100 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                          <Compass className="w-4 h-4" />
                        </div>
                        <span>
                          {getPageString("filter_all_areas")}
                          <span className="text-[10px] opacity-60 font-medium ml-1">({initialProjects.length})</span>
                        </span>
                      </div>
                      {selectedArea === "ALL" && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                      )}
                    </button>

                    {/* Individual Areas */}
                    {popularAreas.map((area: any) => {
                      const isSelected = selectedArea === area.th;
                      const count = area.count || 0;
                      const isDisabled = count === 0;
                      return (
                        <button
                          key={area.th}
                          onClick={() => {
                            setSelectedArea(area.th);
                            setIsAreaDialogOpen(false);
                          }}
                          disabled={isDisabled}
                          className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs transition-all border flex items-center justify-between ${
                            isSelected
                              ? "bg-blue-50/80 border-blue-200 text-blue-600 shadow-xs"
                              : isDisabled
                                ? "border-slate-100 bg-slate-50/40 text-slate-350 cursor-not-allowed opacity-50 pointer-events-none"
                                : "border-slate-100 hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg shrink-0 bg-slate-50 text-slate-500 ${isDisabled ? "opacity-40" : ""}`}>
                              <MapPin className="w-4 h-4" />
                            </div>
                            <span>
                              {area.lang}
                              <span className="text-[10px] text-blue-500 font-medium ml-1">({count})</span>
                            </span>
                          </div>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </ResponsiveDialog>
            )}

            {/* 3. Property Type Selector Dialog */}
            <ResponsiveDialog
              open={isTypeDialogOpen}
              onOpenChange={setIsTypeDialogOpen}
              title={getPageString("filter_property_type")}
              trigger={
                <Button
                  variant="outline"
                  className="h-9 px-3.5 rounded-xl border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700! font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all shrink-0 whitespace-nowrap"
                >
                  <div className="p-0.5 text-blue-600 shrink-0">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  <span>{selectedTypeLabel}</span>
                </Button>
              }
            >
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {sortedPropertyTypes.map((type) => {
                    const isSelected = selectedType === type.value;
                    const labelText = type.label[language as keyof typeof type.label] || type.label.th;
                    const count = type.value === "ALL" ? totalProjectsInProvince : (typeCounts[type.value] || 0);
                    const isDisabled = type.value !== "ALL" && count === 0;

                    return (
                      <button
                        key={type.value}
                        onClick={() => {
                          setSelectedType(type.value);
                          setIsTypeDialogOpen(false);
                        }}
                        disabled={isDisabled}
                        className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs transition-all border flex items-center justify-between ${
                          isSelected
                            ? "bg-blue-50/80 border-blue-200 text-blue-600 shadow-xs"
                            : isDisabled
                              ? "border-slate-100 bg-slate-50/40 text-slate-350 cursor-not-allowed opacity-50 pointer-events-none"
                              : "border-slate-100 hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg shrink-0 ${type.iconBg} ${isDisabled ? "opacity-40" : ""}`}>
                            <type.icon className="w-4 h-4" />
                          </div>
                          <span>
                            {labelText}
                            <span className="text-[10px] opacity-60 font-medium ml-1">
                              ({count})
                            </span>
                          </span>
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </ResponsiveDialog>

            {/* 4. Developer Selector Dialog */}
            {developers.length > 0 && (
              <ResponsiveDialog
                open={isDeveloperDialogOpen}
                onOpenChange={setIsDeveloperDialogOpen}
                title={getPageString("filter_developer")}
                trigger={
                  <Button
                    variant="outline"
                    className="h-9 px-3.5 rounded-xl border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700! font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all shrink-0 whitespace-nowrap"
                  >
                    <div className="p-0.5 text-violet-600 shrink-0">
                      <Building2 className="h-3.5 w-3.5" />
                    </div>
                    <span>
                      {selectedDeveloper === "ALL" 
                        ? getPageString("filter_all_developers") 
                        : selectedDeveloper}
                    </span>
                  </Button>
                }
              >
                <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 ">
                    {/* All Developers Option */}
                    <button
                      onClick={() => {
                        setSelectedDeveloper("ALL");
                        setIsDeveloperDialogOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs transition-all border flex items-center justify-between ${
                        selectedDeveloper === "ALL"
                          ? "bg-blue-50/80 border-blue-200 text-blue-600 shadow-xs"
                          : "border-slate-100 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-violet-50 text-violet-600 shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span>
                          {getPageString("filter_all_developers")}
                          <span className="text-[10px] opacity-60 font-medium ml-1">({initialProjects.length})</span>
                        </span>
                      </div>
                      {selectedDeveloper === "ALL" && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                      )}
                    </button>

                    {/* Individual Developers */}
                    {sortedDevelopers.map((dev) => {
                      const isSelected = selectedDeveloper === dev;
                      const count = developerCounts[dev] || 0;
                      const isDisabled = count === 0;
                      return (
                        <button
                          key={dev}
                          onClick={() => {
                            setSelectedDeveloper(dev);
                            setIsDeveloperDialogOpen(false);
                          }}
                          disabled={isDisabled}
                          className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs transition-all border flex items-center justify-between ${
                            isSelected
                              ? "bg-blue-50/80 border-blue-200 text-blue-600 shadow-xs"
                              : isDisabled
                                ? "border-slate-100 bg-slate-50/40 text-slate-350 cursor-not-allowed opacity-50 pointer-events-none"
                                : "border-slate-100 hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg shrink-0 bg-slate-50 text-slate-500 ${isDisabled ? "opacity-40" : ""}`}>
                              <Building2 className="w-4 h-4" />
                            </div>
                            <span>
                              {dev}
                              <span className="text-[10px] text-blue-500 font-medium ml-1">({count})</span>
                            </span>
                          </div>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </ResponsiveDialog>
            )}

            {/* Clear Filters Button */}
            {(searchQuery || selectedType !== "ALL" || selectedProvince !== "ALL" || selectedArea !== "ALL" || selectedDeveloper !== "ALL" || sortBy !== "DEFAULT") && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 h-9 text-xs font-bold text-red-500 hover:text-red-650 hover:bg-red-50/60 rounded-xl transition-all shrink-0 whitespace-nowrap cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                <span>{getPageString("clear_filters")}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Projects Grid Section */}
      <section className="max-w-screen-2xl mx-auto px-5 md:px-8 pb-20 pt-10">
        {filteredAndSortedProjects.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto">
            <div className="h-16 w-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-455 mb-4 border border-slate-200/50">
              <Building2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">{getPageString("no_projects_found")}</h3>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              {getPageString("clear_filters")}
            </button>
          </div>
        ) : (
          <m.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredAndSortedProjects.map((project) => {
                const nameText = (language === "th" ? project.name.th : (project.name.en || project.name.th)) || project.name.th;
                const hasSale = project.priceMin != null;
                const hasRent = project.rentalMin != null;
                
                let areaName = (
                  language === "en" ? project.popularAreaEn :
                  language === "cn" ? project.popularAreaCn :
                  language === "ru" ? project.popularAreaRu :
                  project.popularArea
                );
                if (language !== "th" && areaName && areaName === project.popularArea) {
                  areaName = translateLocation(areaName, language) || areaName;
                } else if (!areaName && project.popularArea) {
                  areaName = language !== "th" ? translateLocation(project.popularArea, language) : project.popularArea;
                }

                // Find type config
                const typeConfig = PROJECT_PROPERTY_TYPES.find((t) => t.value === String(project.propertyType));
                const typeLabelText = typeConfig ? (typeConfig.label[language as keyof typeof typeConfig.label] || typeConfig.label.th) : "";
                const provinceName = project.province ? getProvinceName(project.province, language) : "";
                const locationText = [areaName, provinceName].filter(Boolean).join(" • ");

                return (
                  <m.div
                    key={project.id}
                    variants={cardVariants}
                    layout
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className="h-full"
                  >
                    <Link
                      href={`/projects/${project.slug}`}
                      className="group bg-white rounded-3xl overflow-hidden border border-slate-200/60 hover:border-slate-350 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                    >
                      {/* Cover Image */}
                      <div className="relative aspect-video w-full bg-slate-100 overflow-hidden shrink-0">
                        {project.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={project.imageUrl}
                            alt={nameText}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-150">
                            <Building2 className="w-12 h-12 text-slate-300" />
                          </div>
                        )}
                        {/* Property Count Badge */}
                        <div className="absolute top-3 right-3 bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10 shadow-xs">
                          {project.propertyCount > 0 
                            ? getPageString("units_available", { count: project.propertyCount })
                            : getPageString("no_units")
                          }
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          {typeConfig && typeConfig.value !== "ALL" && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${typeConfig.iconBg}`}>
                              <typeConfig.icon className="w-3 h-3 stroke-[2.5]" />
                              <span>{typeLabelText}</span>
                            </span>
                          )}
                          {areaName && (
                            <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-650">
                              {areaName}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {nameText}
                        </h3>

                        {project.developer && (
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <span className="font-semibold text-slate-505">{getPageString("developer")}:</span> {project.developer}
                          </p>
                        )}

                        <p className="text-xs text-slate-550 mt-3.5 flex items-center gap-1 line-clamp-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{locationText}</span>
                        </p>

                        {/* Divider */}
                        <div className="h-px bg-slate-100 my-4 w-full" />

                        {/* Price Info */}
                        <div className="mt-auto space-y-2">
                          {hasSale && (
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{getPageString("price_sale")}</span>
                              <span className="text-xs font-extrabold text-blue-600">
                                {getPageString("price_from", { price: `${formatPrice(project.priceMin!, language)} THB` })}
                              </span>
                            </div>
                          )}
                          {hasRent && (
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{getPageString("price_rent")}</span>
                              <span className="text-xs font-extrabold text-teal-600">
                                {getPageString("price_from", { price: `${formatPrice(project.rentalMin!, language)} /mo` })}
                              </span>
                            </div>
                          )}
                          {!hasSale && !hasRent && (
                            <div className="text-center py-1">
                              <span className="text-xs text-slate-400 font-semibold italic">{getPageString("no_units")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </m.div>
                );
              })}
            </AnimatePresence>
          </m.div>
        )}
      </section>
    </>
  );
}
