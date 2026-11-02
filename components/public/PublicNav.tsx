"use client";

import {
  Heart,
  Menu,
  X,
  Plus,
  ChevronDown,
  Building2,
  Home,
  Compass,
  Sparkles,
  Palmtree,
  PawPrint,
  Briefcase,
  Info,
  Phone,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { readFavoriteIds } from "@/lib/favorite-store";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { siteConfig } from "@/lib/site-config";
import { useSiteConfig } from "@/components/providers/SiteConfigProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_LOCALIZATION: Record<string, Record<string, string>> = {
  nav_properties: {
    th: "อสังหาริมทรัพย์",
    en: "Properties",
    cn: "房产项目",
    ru: "Недвижимость",
  },
  nav_explore: {
    th: "ค้นหาอสังหาฯ",
    en: "Explore",
    cn: "房源探索",
    ru: "Поиск",
  },
  nav_curated: {
    th: "คอลเลกชันแนะนำ",
    en: "Curated Collections",
    cn: "精选专题",
    ru: "Коллекции",
  },
  nav_projects: {
    th: "โครงการทั้งหมด",
    en: "Residential Projects",
    cn: "楼盘项目",
    ru: "Все проекты",
  },
  nav_projects_desc: {
    th: "รวมคอนโดมิเนียมและบ้านเด่น 135 โครงการ",
    en: "135+ premier residential projects in Bangkok",
    cn: "135+ 曼谷精选住宅楼盘项目",
    ru: "Более 135 жилых комплексов Бангкока",
  },
  nav_all_props: {
    th: "ทรัพย์สินทั้งหมด",
    en: "All Properties",
    cn: "所有房源",
    ru: "Все объекты",
  },
  nav_all_props_desc: {
    th: "ค้นหาคอนโด บ้าน ซื้อ-เช่า ทุกทำเล",
    en: "Condos, houses for sale & rent across Bangkok",
    cn: "曼谷优质公寓、别墅买卖与租赁",
    ru: "Аренда и продажа квартир и домов",
  },
  nav_map: {
    th: "ค้นหาจากแผนที่",
    en: "Interactive Map",
    cn: "地图找房",
    ru: "Поиск на карте",
  },
  nav_map_desc: {
    th: "ดูพิกัดทรัพย์ใกล้สถานีรถไฟฟ้า BTS/MRT",
    en: "Explore listings near BTS & MRT stations",
    cn: "沿轻轨与地铁站点实时探索房源",
    ru: "Объекты рядом со станциями BTS и MRT",
  },
  nav_prime_cbd: {
    th: "ทำเลทอง Prime CBD",
    en: "Prime CBD Residences",
    cn: "核心CBD商圈",
    ru: "Центр Prime CBD",
  },
  nav_prime_cbd_desc: {
    th: "สุขุมวิท, สาทร, สีลม, เพลินจิต",
    en: "Sukhumvit, Sathorn, Silom & Ploenchit",
    cn: "素坤逸、沙吞、是隆、奔集黄金地段",
    ru: "Сукхумвит, Саторн, Силом, Плончит",
  },
  nav_luxury_villa: {
    th: "บ้านเดี่ยว & พูลวิลล่าหรู",
    en: "Luxury Houses & Villas",
    cn: "豪华独栋与泳池别墅",
    ru: "Элитные дома и виллы",
  },
  nav_luxury_villa_desc: {
    th: "คฤหาสน์หรูและพูลวิลล่าระดับพรีเมียม",
    en: "Super luxury homes & private pool villas",
    cn: "私密泳池高端豪宅典藏",
    ru: "Дома супер-люкс с частным бассейном",
  },
  nav_pet_friendly: {
    th: "คอนโดเลี้ยงสัตว์ได้",
    en: "Pet-Friendly Condos",
    cn: "宠物友好公寓",
    ru: "Pet-Friendly кондо",
  },
  nav_pet_friendly_desc: {
    th: "โครงการที่ต้อนรับสัตว์เลี้ยง",
    en: "Condos welcoming cats & dogs",
    cn: "欢迎猫狗宠物入住的精选大楼",
    ru: "Комплексы для проживания с питомцами",
  },
  nav_office: {
    th: "พื้นที่สำนักงานให้เช่า",
    en: "Office Spaces",
    cn: "写字楼办公出租",
    ru: "Аренда офисов",
  },
  nav_office_desc: {
    th: "ออฟฟิศทำเลธุรกิจพร้อมใช้งาน",
    en: "Prime corporate commercial spaces",
    cn: "核心商务区高品质办公空间",
    ru: "Коммерческие помещения для бизнеса",
  },
  nav_company_group: {
    th: "เกี่ยวกับเรา",
    en: "Company",
    cn: "关于我们",
    ru: "О компании",
  },
  nav_about_company: {
    th: "ข้อมูลบริษัท",
    en: "About VC Connect",
    cn: "公司介绍",
    ru: "О компании VC Connect",
  },
  nav_about_company_desc: {
    th: "วิสัยทัศน์และบริการอสังหาฯ ครบวงจร",
    en: "Our vision & comprehensive solutions",
    cn: "我们的愿景与全方位房产服务",
    ru: "Наше видение и комплексные услуги",
  },
  nav_contact_us: {
    th: "ติดต่อเรา & นัดหมาย",
    en: "Contact & Inquiries",
    cn: "联系与预约看房",
    ru: "Контакты и запись",
  },
  nav_contact_us_desc: {
    th: "สาขา ข้อมูลติดต่อ และการนัดชมทรัพย์",
    en: "Offices, inquiries & viewing appointments",
    cn: "办事处、咨询与预约看房",
    ru: "Офисы, связь и запись на просмотр",
  },
  nav_deposit_btn: {
    th: "ฝากทรัพย์",
    en: "List Property",
    cn: "委托房源",
    ru: "Сдать / Продать",
  },
};

export function PublicNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobilePropExpanded, setMobilePropExpanded] = useState(true);
  const [mobileAboutExpanded, setMobileAboutExpanded] = useState(false);
  const [isNavigatingHome, setIsNavigatingHome] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollPos = useRef(typeof window !== "undefined" ? window.scrollY : 0);
  const currentOffset = useRef(64);

  // Hook for translation
  const { language, langPrefix, setLanguage, t } = useLanguage();
  const homePath = langPrefix || "/";
  const settings = useSiteConfig();
  const siteName = settings.site_name || siteConfig.name;

  const navStr = (key: string): string => {
    return NAV_LOCALIZATION[key]?.[language] || NAV_LOCALIZATION[key]?.th || "";
  };

  // Reset navigatingHome state whenever pathname changes
  useEffect(() => {
    setIsNavigatingHome(false);
  }, [pathname]);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === homePath || pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setIsNavigatingHome(true);
    }
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  // Synchronize CSS variable with visibility state
  useEffect(() => {
    const updateNavOffset = (val: number) => {
      if (currentOffset.current !== val) {
        document.documentElement.style.setProperty("--nav-offset", `${val}px`);
        currentOffset.current = val;
      }
    };
    updateNavOffset(isVisible ? 64 : 0);
  }, [isVisible]);

  function updateFavoriteCount() {
    const ids = readFavoriteIds();
    setFavoriteCount(ids.length);
  }

  useEffect(() => {
    setMounted(true);
    updateFavoriteCount();

    const handleFavoriteUpdate = () => {
      updateFavoriteCount();
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollPos.current;

      setScrolled((prev) => {
        const isCurrentlyScrolled = currentScrollY > 20;
        return prev === isCurrentlyScrolled ? prev : isCurrentlyScrolled;
      });

      if (pathname?.startsWith("/properties") && !mobileMenuOpen) {
        if (Math.abs(scrollDelta) > 2) {
          if (currentScrollY > 20 && scrollDelta > 0) {
            setIsVisible(false);
          } else if (scrollDelta < -5 || currentScrollY < 10) {
            setIsVisible(true);
          }
        }
      } else {
        setIsVisible(true);
      }
      lastScrollPos.current = currentScrollY;
    };

    window.addEventListener("favorite-updated", handleFavoriteUpdate);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("favorite-updated", handleFavoriteUpdate);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname, mobileMenuOpen]);

  // Schema.org for SEO
  const schemaNavLinks = [
    { name: navStr("nav_projects"), href: `${langPrefix}/projects` },
    { name: navStr("nav_all_props"), href: `${langPrefix}/properties` },
    { name: navStr("nav_map"), href: `${langPrefix}/map` },
    { name: navStr("nav_prime_cbd"), href: `${langPrefix}/properties/prime-cbd` },
    { name: navStr("nav_luxury_villa"), href: `${langPrefix}/properties/luxury-villa` },
    { name: navStr("nav_pet_friendly"), href: `${langPrefix}/properties/pet-friendly-condo` },
    { name: navStr("nav_office"), href: `${langPrefix}/properties/office-for-rent` },
    { name: t("nav.services"), href: `${langPrefix}/services` },
    { name: t("nav.blog"), href: `${langPrefix}/blog` },
    { name: navStr("nav_about_company"), href: `${langPrefix}/about` },
    { name: navStr("nav_contact_us"), href: `${langPrefix}/contact` },
    { name: navStr("nav_deposit_btn"), href: `${langPrefix}/deposit` },
  ];

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: "Main Navigation",
    url: schemaNavLinks.map((link) => ({
      "@type": "WebPage",
      name: link.name,
      url: `${siteConfig.url}${link.href}`,
    })),
  };

  const currentLangFlag = {
    th: <span className="fi fi-th h-5 w-7 inline-block shadow-xs" />,
    en: <span className="fi fi-us h-5 w-7 inline-block shadow-xs" />,
    cn: <span className="fi fi-cn h-5 w-7 inline-block shadow-xs" />,
    ru: <span className="fi fi-ru h-5 w-7 inline-block shadow-xs" />,
  };

  return (
    <>
      {mounted && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      )}

      {/* Mobile Menu Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/50 z-[90] transition-opacity duration-300 ease-in-out ${
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div
        className={`fixed top-0 w-full z-[100] transition-transform duration-300 ease-in-out will-change-transform ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <nav
          className={`border-b border-b-slate-200 transition-all duration-300 ${
            scrolled ? "bg-white shadow-xs" : "bg-white"
          }`}
        >
          <div className="max-w-screen-2xl mx-auto px-4 xs:px-6 sm:px-8 md:px-10 lg:px-12 2xl:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo (Acts as Home with Loading Feedback) */}
              <div className="shrink-0">
                <Link
                  href={homePath}
                  onClick={handleLogoClick}
                  className="relative inline-flex items-center active:scale-95 transition-transform duration-150 block cursor-pointer group"
                  aria-label="Back to home"
                >
                  <Image
                    src={settings.logo_light || siteConfig.logo}
                    alt={`${siteName} Logo`}
                    width={300}
                    height={86}
                    className={cn(
                      "h-12 sm:h-16 w-auto -mx-2  sm:mt-1 object-contain transition-all duration-200",
                      isNavigatingHome ? "opacity-30 blur-[0.5px]" : "group-hover:opacity-95"
                    )}
                    style={{ aspectRatio: "300 / 86" }}
                    priority
                    fetchPriority="high"
                  />
                  {isNavigatingHome && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/95 rounded-full shadow-md border border-slate-200/80 backdrop-blur-xs">
                        <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                        <span className="text-[11px] font-bold text-slate-700">กำลังโหลด...</span>
                      </div>
                    </div>
                  )}
                </Link>
              </div>

              {/* Desktop Global Luxury Navigation */}
              <div className="hidden lg:flex items-center gap-7">
                {/* 1. Mega-Menu: Properties */}
                <div className="relative group py-5">
                  <Link
                    href={`${langPrefix}/properties`}
                    className="inline-flex items-center gap-1.5 text-slate-700 group-hover:text-blue-600 transition-colors font-medium text-sm focus:outline-none"
                  >
                    <span>{navStr("nav_properties")}</span>
                    <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180 text-slate-400 group-hover:text-blue-600" />
                  </Link>

                  {/* Mega Menu Dropdown Panel */}
                  <div className="absolute top-full -left-20 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-1.5 group-hover:translate-y-0 transition-all duration-200 ease-out pointer-events-none group-hover:pointer-events-auto z-50">
                    <div className="w-[680px] p-6 bg-white rounded-2xl shadow-2xl border border-slate-100 grid grid-cols-2 gap-6 ring-1 ring-slate-900/5">
                      {/* Col 1: Explore */}
                      <div className="space-y-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
                          {navStr("nav_explore")}
                        </div>
                        <div className="space-y-1">
                          {/* All Properties */}
                          <Link
                            href={`${langPrefix}/properties`}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50/70 transition-colors group/item"
                          >
                            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-indigo-600 group-hover/item:text-white transition-colors">
                              <Home className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900 group-hover/item:text-blue-600 transition-colors">
                                {navStr("nav_all_props")}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{navStr("nav_all_props_desc")}</p>
                            </div>
                          </Link>

                          {/* Interactive Map */}
                          <Link
                            href={`${langPrefix}/map`}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50/70 transition-colors group/item"
                          >
                            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-colors">
                              <Compass className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900 group-hover/item:text-blue-600 transition-colors">
                                {navStr("nav_map")}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{navStr("nav_map_desc")}</p>
                            </div>
                          </Link>
                          {/* Projects */}
                          <Link
                            href={`${langPrefix}/projects`}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50/70 transition-colors group/item"
                          >
                            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-blue-600 group-hover/item:text-white transition-colors">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900 group-hover/item:text-blue-600 transition-colors flex items-center gap-1.5">
                                <span>{navStr("nav_projects")}</span>
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">135+</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{navStr("nav_projects_desc")}</p>
                            </div>
                          </Link>
                        </div>
                      </div>

                      {/* Col 2: Curated Collections */}
                      <div className="space-y-3 pl-2 border-l border-slate-100">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
                          {navStr("nav_curated")}
                        </div>
                        <div className="space-y-1">
                          {/* Prime CBD */}
                          <Link
                            href={`${langPrefix}/properties/prime-cbd`}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group/item"
                          >
                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-900 group-hover/item:text-blue-600 transition-colors">
                                {navStr("nav_prime_cbd")}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{navStr("nav_prime_cbd_desc")}</p>
                            </div>
                          </Link>

                          {/* Luxury Villa */}
                          <Link
                            href={`${langPrefix}/properties/luxury-villa`}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group/item"
                          >
                            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                              <Palmtree className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-900 group-hover/item:text-blue-600 transition-colors">
                                {navStr("nav_luxury_villa")}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{navStr("nav_luxury_villa_desc")}</p>
                            </div>
                          </Link>

                          {/* Pet Friendly */}
                          <Link
                            href={`${langPrefix}/properties/pet-friendly-condo`}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group/item"
                          >
                            <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center shrink-0 mt-0.5">
                              <PawPrint className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-900 group-hover/item:text-blue-600 transition-colors">
                                {navStr("nav_pet_friendly")}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{navStr("nav_pet_friendly_desc")}</p>
                            </div>
                          </Link>

                          {/* Office */}
                          <Link
                            href={`${langPrefix}/properties/office-for-rent`}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group/item"
                          >
                            <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5">
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-900 group-hover/item:text-blue-600 transition-colors">
                                {navStr("nav_office")}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{navStr("nav_office_desc")}</p>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Services */}
                <Link
                  href={`${langPrefix}/services`}
                  className="text-slate-700 hover:text-blue-600 transition-colors font-medium text-sm relative group py-5"
                >
                  {t("nav.services")}
                  <span className="absolute bottom-3 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                </Link>

                {/* 3. Blog */}
                <Link
                  href={`${langPrefix}/blog`}
                  className="text-slate-700 hover:text-blue-600 transition-colors font-medium text-sm relative group py-5"
                >
                  {t("nav.blog")}
                  <span className="absolute bottom-3 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                </Link>

                {/* 4. Company (About Us) Dropdown */}
                <div className="relative group py-5">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-slate-700 group-hover:text-blue-600 transition-colors font-medium text-sm focus:outline-none"
                  >
                    <span>{navStr("nav_company_group")}</span>
                    <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180 text-slate-400 group-hover:text-blue-600" />
                  </button>

                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-1.5 group-hover:translate-y-0 transition-all duration-200 ease-out pointer-events-none group-hover:pointer-events-auto z-50">
                    <div className="w-[280px] p-2 bg-white rounded-2xl shadow-xl border border-slate-100 space-y-1 ring-1 ring-slate-900/5">
                      <Link
                        href={`${langPrefix}/about`}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50/70 transition-colors group/item"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover/item:bg-blue-600 group-hover/item:text-white transition-colors">
                          <Info className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 group-hover/item:text-blue-600 transition-colors">
                            {navStr("nav_about_company")}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{navStr("nav_about_company_desc")}</p>
                        </div>
                      </Link>

                      <Link
                        href={`${langPrefix}/contact`}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50/70 transition-colors group/item"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-colors">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 group-hover/item:text-blue-600 transition-colors">
                            {navStr("nav_contact_us")}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{navStr("nav_contact_us_desc")}</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Actions & Utilities Container */}
                <div className="flex items-center gap-1 pl-4 ml-1 border-l border-slate-200">
                  {/* Language Switcher */}
                  {mounted ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-slate-700 font-medium px-2.5 h-9 hover:bg-slate-100 rounded-lg cursor-pointer"
                          aria-label={t("nav.select_language") || "Select language"}
                        >
                          {currentLangFlag[language]}
                          <span className="uppercase text-xs font-semibold text-slate-600">
                            {language}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-[150px] z-200"
                      >
                        <DropdownMenuItem
                          onClick={() => setLanguage("th")}
                          className="cursor-pointer"
                        >
                          <div className="flex justify-between items-center w-full">
                            <div className="flex items-center">
                              <span className="fi fi-th h-4 w-6 inline-block mr-3 shadow-xs" />
                              <span className="font-medium">Thai</span>
                            </div>
                            {language === "th" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            )}
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setLanguage("en")}
                          className="cursor-pointer"
                        >
                          <div className="flex justify-between items-center w-full">
                            <div className="flex items-center">
                              <span className="fi fi-us h-4 w-6 inline-block mr-3 shadow-xs" />
                              <span className="font-medium">English</span>
                            </div>
                            {language === "en" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            )}
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setLanguage("cn")}
                          className="cursor-pointer"
                        >
                          <div className="flex justify-between items-center w-full">
                            <div className="flex items-center">
                              <span className="fi fi-cn h-4 w-6 inline-block mr-3 shadow-xs" />
                              <span className="font-medium">Chinese</span>
                            </div>
                            {language === "cn" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            )}
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setLanguage("ru")}
                          className="cursor-pointer"
                        >
                          <div className="flex justify-between items-center w-full">
                            <div className="flex items-center">
                              <span className="fi fi-ru h-4 w-6 inline-block mr-3 shadow-xs" />
                              <span className="font-medium">Russian</span>
                            </div>
                            {language === "ru" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-slate-700 font-medium px-2.5 h-9"
                    >
                      <span className="fi fi-th h-4 w-6 inline-block shadow-xs" />
                      <span className="uppercase text-xs font-semibold text-slate-600">
                        TH
                      </span>
                    </Button>
                  )}

                  {/* Favorites */}
                  <Link
                    href={`${langPrefix}/favorites`}
                    className="text-slate-600 hover:text-red-500 hover:bg-red-50/60 transition-colors w-9 h-9 rounded-lg flex items-center justify-center relative group"
                    aria-label="favorites"
                  >
                    <div className="relative">
                      <Heart
                        className={`h-5 w-5 transition-all ${
                          favoriteCount > 0
                            ? "fill-red-500 text-red-500"
                            : "text-slate-600 fill-transparent group-hover:text-red-500 group-hover:fill-red-500"
                        }`}
                      />
                      {favoriteCount > 0 && (
                        <span className="absolute -top-1.5 -right-2 h-4 w-4 bg-gradient-to-br from-pink-500 to-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                          {favoriteCount > 99 ? "99+" : favoriteCount}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Primary CTA Button: Consignment */}
                  <div className="flex items-center ml-2">
                    <Button
                      asChild
                      size="sm"
                      className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xs font-semibold text-white px-4 h-9.5 rounded-xl outline-none ring-0 border-0"
                    >
                      <Link href={`${langPrefix}/deposit`}>
                        <Plus className="h-4 w-4 mr-1.5" />
                        <span>{navStr("nav_deposit_btn")}</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mobile Right Controls: Lang + Fav + Hamburger */}
              <div className="lg:hidden flex items-center gap-2">
                {/* Mobile Language Switcher */}
                {mounted ? (
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        className="text-slate-600 hover:bg-slate-100 h-10 w-12 flex items-center justify-center p-0"
                        aria-label={t("nav.change_language") || "Change language"}
                      >
                        {currentLangFlag[language]}
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="bottom"
                      className="h-auto rounded-t-2xl flex flex-col p-4 pb-8 bg-white"
                    >
                      <div className="space-y-3">
                        <SheetClose asChild>
                          <button
                            onClick={() => setLanguage("th")}
                            className={cn(
                              "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                              language === "th"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-slate-50 text-slate-700 border-slate-100"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <span className="fi fi-th h-5 w-7 inline-block rounded-xs shadow-xs">&nbsp;</span>
                              <span className="font-bold">Thai (ภาษาไทย)</span>
                            </div>
                            {language === "th" && (
                              <div className="w-2 h-2 rounded-full bg-white shadow-xs" />
                            )}
                          </button>
                        </SheetClose>
                        <SheetClose asChild>
                          <button
                            onClick={() => setLanguage("en")}
                            className={cn(
                              "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                              language === "en"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-slate-50 text-slate-700 border-slate-100"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <span className="fi fi-us h-5 w-7 inline-block rounded-xs shadow-xs">&nbsp;</span>
                              <span className="font-bold">English</span>
                            </div>
                            {language === "en" && (
                              <div className="w-2 h-2 rounded-full bg-white shadow-xs" />
                            )}
                          </button>
                        </SheetClose>
                        <SheetClose asChild>
                          <button
                            onClick={() => setLanguage("cn")}
                            className={cn(
                              "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                              language === "cn"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-slate-50 text-slate-700 border-slate-100"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <span className="fi fi-cn h-5 w-7 inline-block rounded-xs shadow-xs">&nbsp;</span>
                              <span className="font-bold">Chinese (中文)</span>
                            </div>
                            {language === "cn" && (
                              <div className="w-2 h-2 rounded-full bg-white shadow-xs" />
                            )}
                          </button>
                        </SheetClose>
                        <SheetClose asChild>
                          <button
                            onClick={() => setLanguage("ru")}
                            className={cn(
                              "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                              language === "ru"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-slate-50 text-slate-700 border-slate-100"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <span className="fi fi-ru h-5 w-7 inline-block rounded-xs shadow-xs">&nbsp;</span>
                              <span className="font-bold">Russian (Русский)</span>
                            </div>
                            {language === "ru" && (
                              <div className="w-2 h-2 rounded-full bg-white shadow-xs" />
                            )}
                          </button>
                        </SheetClose>
                      </div>
                    </SheetContent>
                  </Sheet>
                ) : (
                  <Button variant="ghost" size="icon" className="text-slate-600">
                    <span className="fi fi-th h-3 w-4 inline-block rounded-xs shadow-xs">&nbsp;</span>
                  </Button>
                )}

                {/* Mobile Favorites */}
                <Link
                  href={`${langPrefix}/favorites`}
                  className="relative group p-2"
                  aria-label="favorites"
                >
                  <Heart
                    className={`h-6 w-6 transition-colors ${
                      favoriteCount > 0
                        ? "text-red-500 fill-red-500"
                        : "text-slate-600 group-hover:text-red-500"
                    }`}
                  />
                  {favoriteCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
                      {favoriteCount > 9 ? "9+" : favoriteCount}
                    </span>
                  )}
                </Link>

                {/* Hamburger Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-slate-600 hover:text-blue-600 transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <X className="h-7 w-7" />
                  ) : (
                    <Menu className="h-7 w-7" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Drawer (Accordion) */}
          <div
            className={`lg:hidden relative z-10 border-t border-slate-200 shadow-lg bg-white overflow-y-auto transition-all rounded-b-2xl duration-300 ease-in-out ${
              mobileMenuOpen
                ? "max-h-[calc(100dvh-4rem)] opacity-100"
                : "max-h-0 opacity-0 border-t-transparent pointer-events-none"
            }`}
          >
            <div className="px-4 py-4 space-y-2">
              {/* Mobile Properties Accordion */}
              <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setMobilePropExpanded(!mobilePropExpanded)}
                  className="w-full flex items-center justify-between p-3.5 text-sm font-bold text-slate-900 hover:bg-slate-100/70 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>{navStr("nav_properties")}</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      mobilePropExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {mobilePropExpanded && (
                  <div className="px-3 pb-3 pt-1 space-y-1 bg-white border-t border-slate-100">
                    <Link
                      href={`${langPrefix}/projects`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <span className="flex items-center gap-2.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>{navStr("nav_projects")}</span>
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">135+</span>
                    </Link>

                    <Link
                      href={`${langPrefix}/properties`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Home className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{navStr("nav_all_props")}</span>
                    </Link>

                    <Link
                      href={`${langPrefix}/map`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Compass className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{navStr("nav_map")}</span>
                    </Link>

                    <div className="pt-2 pb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100">
                      {navStr("nav_curated")}
                    </div>

                    <Link
                      href={`${langPrefix}/properties/prime-cbd`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-lg text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-800"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>{navStr("nav_prime_cbd")}</span>
                    </Link>

                    <Link
                      href={`${langPrefix}/properties/luxury-villa`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-lg text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-800"
                    >
                      <Palmtree className="w-3.5 h-3.5 text-purple-600" />
                      <span>{navStr("nav_luxury_villa")}</span>
                    </Link>

                    <Link
                      href={`${langPrefix}/properties/pet-friendly-condo`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-lg text-xs text-slate-700 hover:bg-pink-50 hover:text-pink-800"
                    >
                      <PawPrint className="w-3.5 h-3.5 text-pink-600" />
                      <span>{navStr("nav_pet_friendly")}</span>
                    </Link>

                    <Link
                      href={`${langPrefix}/properties/office-for-rent`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-lg text-xs text-slate-700 hover:bg-cyan-50 hover:text-cyan-800"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-cyan-600" />
                      <span>{navStr("nav_office")}</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Services */}
              <Link
                href={`${langPrefix}/services`}
                onClick={() => setMobileMenuOpen(false)}
                className="block p-3.5 text-sm font-bold text-slate-900 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
              >
                {t("nav.services")}
              </Link>

              {/* Blog */}
              <Link
                href={`${langPrefix}/blog`}
                onClick={() => setMobileMenuOpen(false)}
                className="block p-3.5 text-sm font-bold text-slate-900 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
              >
                {t("nav.blog")}
              </Link>

              {/* Company (About Us) Accordion */}
              <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setMobileAboutExpanded(!mobileAboutExpanded)}
                  className="w-full flex items-center justify-between p-3.5 text-sm font-bold text-slate-900 hover:bg-slate-100/70 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-600" />
                    <span>{navStr("nav_company_group")}</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      mobileAboutExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {mobileAboutExpanded && (
                  <div className="px-3 pb-3 pt-1 space-y-1 bg-white border-t border-slate-100">
                    <Link
                      href={`${langPrefix}/about`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      <span>{navStr("nav_about_company")}</span>
                    </Link>

                    <Link
                      href={`${langPrefix}/contact`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{navStr("nav_contact_us")}</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Consignment CTA */}
              <div
                className="pt-3 border-t border-slate-200"
                style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
              >
                <Button
                  asChild
                  size="lg"
                  className="w-full cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6 text-base font-bold shadow-md outline-none ring-0 border-0 text-white rounded-xl"
                >
                  <Link
                    href={`${langPrefix}/deposit`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    <span>{navStr("nav_deposit_btn")}</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
