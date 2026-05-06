"use client";

import { Home, Heart, Menu, X, Search, Key } from "lucide-react";
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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { DepositWizard } from "./deposit/DepositWizard";
import { CheckCircle } from "lucide-react";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { cn } from "@/lib/utils";

export function PublicNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isDepositSuccess, setIsDepositSuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollPos = useRef(typeof window !== "undefined" ? window.scrollY : 0);
  const currentOffset = useRef(64);

  // Hook for translation
  const { language, setLanguage, t } = useLanguage();
  const settings = useSiteConfig();
  const siteName = settings.site_name || siteConfig.name;

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

  useEffect(() => {
    // Initial load
    setMounted(true);
    updateFavoriteCount();

    // Listen for favorite updates
    const handleFavoriteUpdate = () => {
      updateFavoriteCount();
    };

    // Scroll listener
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollPos.current;
      
      // Update scrolled state (shadow)
      setScrolled((prev) => {
        const isCurrentlyScrolled = currentScrollY > 20;
        return prev === isCurrentlyScrolled ? prev : isCurrentlyScrolled;
      });

      // Only hide/show on scroll for /properties page
      if (pathname === "/properties" && !mobileMenuOpen) {
        // High sensitivity for faster hiding/showing
        if (Math.abs(scrollDelta) > 2) {
          if (currentScrollY > 20 && scrollDelta > 0) {
            // Scrolling down - hide quickly
            setIsVisible(false);
          } else if (scrollDelta < -5 || currentScrollY < 10) {
            // Scrolling up - show quickly
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
  }, [pathname]);

  function updateFavoriteCount() {
    const ids = readFavoriteIds();
    setFavoriteCount(ids.length);
  }

  const navigationLinks = [
    { name: t("nav.home"), href: "/" },
    { name: t("nav.properties"), href: "#latest-properties" },
    { name: t("nav.services"), href: "/services" },
    { name: t("nav.blog"), href: "/blog" },
    { name: t("nav.about"), href: "/about" },
    { name: t("nav.contact"), href: "/contact" },
  ];

  // Smooth scroll handler
  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();

      // If we are not on the home page, navigate to home with the hash
      if (pathname !== "/") {
        router.push(`/${href}`);
        setMobileMenuOpen(false);
        return;
      }

      // If we are on home page, smooth scroll
      const element = document.querySelector(href);
      if (element) {
        const offsetTop =
          element.getBoundingClientRect().top + window.scrollY - 80; // 80px offset for fixed nav
        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        });
      }
      setMobileMenuOpen(false);
    }
  };

  // Schema.org for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: "Main Navigation",
    url: navigationLinks.map((link) => ({
      "@type": "WebPage",
      name: link.name,
      url: `${siteConfig.url}${link.href}`,
    })),
  };
  const currentLangFlag = {
    th: <span className="fi fi-th h-4 w-6 shadow-sm" />,
    en: <span className="fi fi-us h-4 w-6 shadow-sm" />,
    cn: <span className="fi fi-cn h-4 w-6 shadow-sm" />,
    ru: <span className="fi fi-ru h-4 w-6 shadow-sm" />,
  };

  return (
    <>
      {/* Schema.org Structured Data */}
      {mounted && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      )}

      {/* Mobile Menu Backdrop (Focus effect) */}
      <div
        className={`xl:hidden fixed inset-0 bg-black/30 backdrop-blur-lg z-90 transition-opacity duration-300 ease-in-out ${
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div
        className={`fixed top-0 w-full z-100 transition-transform duration-300 ease-in-out will-change-transform ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <nav
          className={`border-b border-b-slate-200 transition-all duration-300 ${
            scrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-white"
          }`}
          style={scrolled ? { WebkitBackdropFilter: "blur(12px)" } : undefined}
        >
          <div className="max-w-screen-2xl mx-auto px-4 xs:px-6 sm:px-10 md:px-10 lg:px-12 xl:px-14 2xl:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div>
                <Link
                  href="/"
                  className="hover:scale-105 transition-transform block"
                >
                  <Image
                    src={settings.logo_light || siteConfig.logo}
                    alt={`${siteName} Logo`}
                    width={280}
                    height={80}
                    className="h-13 sm:h-16 w-auto -mx-2 mt-1"
                    priority
                  />
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden xl:flex items-center gap-6">
                {navigationLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href as string)}
                    className="text-slate-600 hover:text-blue-600 transition-colors font-medium text-sm relative group"
                  >
                    {link.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-linear-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
                  </a>
                ))}

                {/* Language Switcher */}
                {mounted ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-slate-600 font-medium px-2 hover:bg-slate-100"
                      >
                        {currentLangFlag[language]}
                        <span className="uppercase text-xs font-semibold text-slate-500">
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
                        className={`cursor-pointer ${language === "th" ? "bg-slate-50" : ""}`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center">
                            <span className="fi fi-th h-4 w-6 inline-block mr-3 rounded-sm shadow-sm" />
                            <span className="font-medium">Thai</span>
                          </div>
                          {language === "th" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          )}
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setLanguage("en")}
                        className={`cursor-pointer ${language === "en" ? "bg-slate-50" : ""}`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center">
                            <span className="fi fi-us h-4 w-6 inline-block mr-3 rounded-sm shadow-sm" />
                            <span className="font-medium">English</span>
                          </div>
                          {language === "en" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          )}
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setLanguage("cn")}
                        className={`cursor-pointer ${language === "cn" ? "bg-slate-50" : ""}`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center">
                            <span className="fi fi-cn h-4 w-6 inline-block mr-3 rounded-sm shadow-sm" />
                            <span className="font-medium">Chinese</span>
                          </div>
                          {language === "cn" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          )}
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setLanguage("ru")}
                        className={`cursor-pointer ${language === "ru" ? "bg-slate-50" : ""}`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center">
                            <span className="fi fi-ru h-4 w-6 inline-block mr-3 rounded-sm shadow-sm" />
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
                    className="gap-2 text-slate-600 font-medium opacity-50 cursor-wait px-2"
                  >
                    <span className="fi fi-th h-3 w-4 rounded-sm shadow-sm" />
                    <span className="uppercase text-xs font-bold text-slate-500">
                      TH
                    </span>
                  </Button>
                )}

                {/* Favorites Button */}
                <Link
                  href="/favorites"
                  className="relative group"
                  aria-label="favorites"
                >
                  <div
                    className={`flex items-center gap-2 transition-colors ${
                      favoriteCount > 0
                        ? "text-red-500"
                        : "text-slate-600 hover:text-pink-600"
                    }`}
                  >
                    <Heart
                      className={`h-5 w-5 transition-all ${
                        favoriteCount > 0
                          ? "fill-red-500"
                          : "group-hover:fill-pink-600"
                      }`}
                    />
                    {favoriteCount > 0 && (
                      <span className="absolute -top-2 -right-2 h-5 w-5 bg-linear-to-br from-pink-500 to-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        {favoriteCount > 99 ? "99+" : favoriteCount}
                      </span>
                    )}
                  </div>
                </Link>

                {/* CTA Buttons */}
                <div className="flex items-center gap-2 ml-2">
                  <Link href="/properties">
                    <Button
                      variant="outline"
                      size="lg"
                      className="hover:bg-blue-500! hover:border-blue-500! hover:text-white! "
                    >
                      <Search className="h-4 w-4 mr-1" />
                      {t("home.search_btn")}
                    </Button>
                  </Link>

                  <ResponsiveDialog
                    open={isDepositOpen}
                    onOpenChange={(open) => {
                      setIsDepositOpen(open);
                      if (!open) setIsDepositSuccess(false);
                    }}
                    trigger={
                      <Button
                        size="lg"
                        className="cursor-pointer bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md font-medium outline-none ring-0 border-0 text-white"
                      >
                        <Key className="h-4 w-4 mr-1" />
                        {t("nav.deposit")}
                      </Button>
                    }
                    className="sm:max-w-[720px] lg:max-w-[800px] p-0 border-0 gap-0 rounded-3xl"
                  >
                    {isDepositSuccess ? (
                      <div className="text-center py-20 px-6 space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-linear-to-br from-green-50 to-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                          <CheckCircle className="h-12 w-12" />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                            {t("deposit.success.title")}
                          </h3>
                          <p className="text-slate-500 text-base md:text-lg max-w-sm mx-auto">
                            {t("deposit.success.message")}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsDepositSuccess(false);
                            setIsDepositOpen(false);
                          }}
                          className="mt-6 border-slate-200 hover:bg-slate-50 rounded-2xl px-12 py-7 text-base font-bold transition-all hover:scale-105 active:scale-95 shadow-sm"
                        >
                          {t("common.close")}
                        </Button>
                      </div>
                    ) : (
                      <DepositWizard
                        onSuccessAction={() => setIsDepositSuccess(true)}
                        onCancelAction={() => setIsDepositOpen(false)}
                        location="Navbar"
                        
                      />
                    )}
                  </ResponsiveDialog>
                </div>
              </div>

              {/* Mobile Menu Button + Lang */}
              <div className="xl:hidden flex items-center gap-3">
                {/* Mobile Language Switcher (Compact) */}
                {mounted ? (
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-600 hover:bg-slate-100"
                      >
                        {currentLangFlag[language]}
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="bottom"
                      className="h-auto rounded-t-2xl flex flex-col p-4 pb-8 bg-white"
                    >
                      <SheetHeader className="pb-4 border-b border-slate-100">
                        <SheetTitle className="text-slate-900">
                          {t("nav.select_language")}
                        </SheetTitle>
                      </SheetHeader>
                      <div className="py-4 space-y-3">
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
                              <span className="fi fi-th h-5 w-7 inline-block rounded-sm shadow-sm">&nbsp;</span>
                              <span className="font-bold">Thai (ภาษาไทย)</span>
                            </div>
                            {language === "th" && (
                              <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
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
                              <span className="fi fi-us h-5 w-7 inline-block rounded-sm shadow-sm">&nbsp;</span>
                              <span className="font-bold">English</span>
                            </div>
                            {language === "en" && (
                              <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
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
                              <span className="fi fi-cn h-5 w-7 inline-block rounded-sm shadow-sm">&nbsp;</span>
                              <span className="font-bold">Chinese (中文)</span>
                            </div>
                            {language === "cn" && (
                              <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
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
                              <span className="fi fi-ru h-5 w-7 inline-block rounded-sm shadow-sm">&nbsp;</span>
                              <span className="font-bold">Russian (Русский)</span>
                            </div>
                            {language === "ru" && (
                              <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                            )}
                          </button>
                        </SheetClose>
                      </div>
                    </SheetContent>
                  </Sheet>
                ) : (
                  <Button variant="ghost" size="icon" className="text-slate-600">
                    <span className="fi fi-th h-3 w-4 inline-block rounded-sm shadow-sm">&nbsp;</span>
                  </Button>
                )}

                {/* Mobile Favorites */}
                <Link
                  href="/favorites"
                  className="relative group p-2"
                  aria-label="favorites"
                >
                  <Heart
                    className={`h-6 w-6 transition-colors ${
                      favoriteCount > 0
                        ? "text-red-500 fill-red-500"
                        : "text-slate-600 group-hover:text-slate-900"
                    }`}
                  />
                  {favoriteCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
                      {favoriteCount > 9 ? "9+" : favoriteCount}
                    </span>
                  )}
                </Link>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-slate-600 hover:text-blue-600 transition-colors "
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

          {/* Mobile Menu Backdrop moved to top-level for focus effect */}

          {/* Mobile Menu */}
          <div
            className={`xl:hidden relative z-10 border-t border-slate-200 shadow-lg bg-white overflow-hidden transition-all rounded-b-xl   duration-300 ease-in-out ${
              mobileMenuOpen
                ? "max-h-[500px] opacity-100 "
                : "max-h-0 opacity-0 border-t-transparent"
            }`}
          >
            <div className="px-4 py-4 space-y-3">
              {navigationLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href as string)}
                  className="block px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors font-medium "
                >
                  {link.name}
                </a>
              ))}

              <div className="pt-4 border-t border-slate-200 flex flex-col gap-3" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                <div className="flex gap-2 sm:gap-3">
                  <Link
                    href="/properties"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 min-w-0"
                  >
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full cursor-pointer border-blue-600 text-blue-600 hover:bg-blue-50 py-6  text-sm sm:text-base"
                    >
                      <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 shrink-0" />
                      <span className="truncate">{t("home.search_btn")}</span>
                    </Button>
                  </Link>
                  <Button
                    size="lg"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsDepositOpen(true);
                    }}
                    className="flex-1 min-w-0 cursor-pointer bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6  text-sm sm:text-base outline-none ring-0 border-0 text-white"
                  >
                    <Key className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 shrink-0" />
                    <span className="truncate">{t("nav.deposit")}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
