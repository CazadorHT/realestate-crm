"use client";

import { Home, Heart, Menu, X, Search, Key } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readFavoriteIds } from "@/lib/favorite-store";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PublicNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hook for translation
  const { language, setLanguage, t } = useLanguage();

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
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("favorite-updated", handleFavoriteUpdate);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("favorite-updated", handleFavoriteUpdate);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function updateFavoriteCount() {
    const ids = readFavoriteIds();
    setFavoriteCount(ids.length);
  }

  const navigationLinks = [
    { name: t("nav.home"), href: "/" },
    { name: t("nav.properties"), href: "#latest-properties" },
    { name: t("nav.services"), href: "/services" },
    { name: t("nav.blog"), href: "#blog" },
    { name: t("nav.about"), href: "#trust" },
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
      url: `https://oma-asset.com${link.href}`,
    })),
  };

  const currentLangFlag = {
    th: <span className="fi fi-th h-4 w-6 shadow-sm" />,
    en: <span className="fi fi-us h-4 w-6 shadow-sm" />,
    cn: <span className="fi fi-cn h-4 w-6 shadow-sm" />,
  };

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div
        className={`border-b fixed border-b-slate-200 top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 shadow-lg border-slate-200"
            : "bg-white border-slate-200"
        }`}
      >
        <nav>
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div>
                <Link
                  href="/"
                  className="hover:scale-105 transition-transform block"
                >
                  <Image
                    // src="/images/oma-asset-logo.svg"
                    src="/images/Frame 85.svg"
                    alt="OMA ASSET Logo"
                    width={220}
                    height={70}
                    className="h-12 w-auto"
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
                    <DropdownMenuContent align="end" className="w-[150px]">
                      <DropdownMenuItem
                        onClick={() => setLanguage("th")}
                        className={`cursor-pointer ${language === "th" ? "bg-slate-50" : ""}`}
                      >
                        <span className="fi fi-th mr-3 rounded-sm shadow-sm" />
                        <span className="font-medium">Thai</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setLanguage("en")}
                        className={`cursor-pointer ${language === "en" ? "bg-slate-50" : ""}`}
                      >
                        <span className="fi fi-us mr-3 rounded-sm shadow-sm" />
                        <span className="font-medium">English</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setLanguage("cn")}
                        className={`cursor-pointer ${language === "cn" ? "bg-slate-50" : ""}`}
                      >
                        <span className="fi fi-cn mr-3 rounded-sm shadow-sm" />
                        <span className="font-medium">Chinese</span>
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
                      className="border-blue-600 cursor-pointer text-blue-600 hover:bg-linear-to-r hover:from-sky-500 hover:to-blue-500 hover:text-white hover:border-sky-500 duration-300 transition-all font-medium"
                    >
                      <Search className="h-4 w-4 mr-1" />
                      {t("home.search_btn")}
                    </Button>
                  </Link>
                  <a
                    href="#deposit-section"
                    onClick={(e) => handleNavClick(e, "#deposit-section")}
                  >
                    <Button
                      size="lg"
                      className="cursor-pointer bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md font-medium"
                    >
                      <Key className="h-4 w-4 mr-1" />
                      {t("nav.deposit")}
                    </Button>
                  </a>
                </div>
              </div>

              {/* Mobile Menu Button + Lang */}
              <div className="xl:hidden flex items-center gap-3">
                {/* Mobile Language Switcher (Compact) */}
                {mounted ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-600 hover:bg-slate-100"
                      >
                        {/* Mobile: Just the flag */}
                        {currentLangFlag[language]}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setLanguage("th")}
                        className="gap-3"
                      >
                        <span className="fi fi-th mr-3 rounded-sm shadow-sm" />{" "}
                        TH
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setLanguage("en")}
                        className="gap-3"
                      >
                        <span className="fi fi-us mr-3 rounded-sm shadow-sm" />{" "}
                        EN
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setLanguage("cn")}
                        className="gap-3"
                      >
                        <span className="fi fi-cn mr-3 rounded-sm shadow-sm" />{" "}
                        CN
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-600"
                  >
                    <span className="fi fi-th h-3 w-4 rounded-sm shadow-sm" />
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

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="xl:hidden border-t border-slate-200 bg-white">
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

                <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <Link
                      href="/properties"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full cursor-pointer border-blue-600 text-blue-600 hover:bg-blue-50 py-6 text-base"
                      >
                        <Search className="h-5 w-5 mr-2" />
                        {t("home.search_btn")}
                      </Button>
                    </Link>
                    <a
                      href="#deposit-section"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1"
                    >
                      <Button
                        size="lg"
                        className="w-full cursor-pointer bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6 text-base"
                      >
                        <Key className="h-5 w-5 mr-2" />
                        {t("nav.deposit")}
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}
