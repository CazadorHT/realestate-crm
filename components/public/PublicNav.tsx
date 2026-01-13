"use client";

import { Home, Heart, Menu, X, Search, Key } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readFavoriteIds } from "@/lib/favorite-store";
import { Button } from "@/components/ui/button";

export function PublicNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Initial load
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
    { name: "หน้าหลัก", href: "/" },
    { name: "ทรัพย์สิน", href: "#latest-properties" },
    { name: "วิธีการทำงาน", href: "#how-it-works" },
    { name: "บทความ", href: "#blog" },
    { name: "คำถามที่พบบ่อย", href: "#faq" },
    { name: "เกี่ยวกับเรา", href: "#trust" },
  ];

  // Smooth scroll handler
  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
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
      url: `https://your-domain.com${link.href}`,
    })),
  };

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div
        className={`backdrop-blur-md border-b fixed top-0 w-full z-50 transition-all duration-300 ${
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
                  className="text-xl flex items-center gap-2 font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:scale-105 transition-transform"
                >
                  <div className="p-1.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                    <Home className="h-5 w-5 text-white" />
                  </div>
                  SABAICAZA
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-6">
                {navigationLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-slate-600 hover:text-blue-600 transition-colors font-medium text-sm relative group"
                  >
                    {link.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
                  </a>
                ))}

                {/* Favorites Button */}
                <Link
                  href="/favorites"
                  className="relative group"
                  aria-label="รายการโปรด"
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
                      <span className="absolute -top-2 -right-2 h-5 w-5 bg-gradient-to-br from-pink-500 to-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
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
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      <Search className="h-4 w-4 mr-1" />
                      ค้นหา
                    </Button>
                  </Link>
                  <a
                    href="#deposit-section"
                    onClick={(e) => handleNavClick(e, "#deposit-section")}
                  >
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md"
                    >
                      <Key className="h-4 w-4 mr-1" />
                      ฝากทรัพย์
                    </Button>
                  </a>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <div className="lg:hidden flex items-center gap-4">
                {/* Mobile Favorites */}
                <Link
                  href="/favorites"
                  className="relative group"
                  aria-label="รายการโปรด"
                >
                  <Heart
                    className={`h-5 w-5 transition-colors ${
                      favoriteCount > 0
                        ? "text-red-500 fill-red-500"
                        : "text-slate-600 group-hover:text-slate-900"
                    }`}
                  />
                  {favoriteCount > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 bg-gradient-to-br from-pink-500 to-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm border border-white">
                      {favoriteCount > 99 ? "99+" : favoriteCount}
                    </span>
                  )}
                </Link>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-slate-600 hover:text-blue-600 transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-200 bg-white">
              <div className="px-4 py-4 space-y-3">
                {navigationLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="block px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors font-medium"
                  >
                    {link.name}
                  </a>
                ))}

                <div className="pt-4 space-y-2 border-t border-slate-200 ">
                  <Link
                    href="/properties"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full  border-blue-600 text-blue-600 hover:bg-blue-50 py-6 text-base"
                    >
                      <Search className="h-5 w-5 mr-2" />
                      ค้นหาทรัพย์สิน
                    </Button>
                  </Link>
                  <a
                    href="#deposit-section"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      size="lg"
                      className="w-full  bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6 text-base"
                    >
                      <Key className="h-5 w-5 mr-2" />
                      ฝากทรัพย์กับเรา
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}
