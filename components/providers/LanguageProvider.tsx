"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import th from "@/i18n/locales/th.json";
import en from "@/i18n/locales/en.json";
import cn from "@/i18n/locales/cn.json";
import ru from "@/i18n/locales/ru.json";

export type Language = "th" | "en" | "cn" | "ru";

// Helper to access nested keys "nav.home"
function getNestedValue(obj: any, path: string): string {
  return path.split(".").reduce((prev, curr) => prev?.[curr], obj) || path;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

// Reload dictionaries to pick up new JSON keys
export const dictionaries = { th, en, cn, ru };

export function LanguageProvider({
  children,
  initialLanguage = "th",
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const router = useRouter();
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const [mounted, setMounted] = useState(false);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("app-language", lang);
      document.cookie = `app-language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignore in private mode
    }

    // Refresh to update server components (metadata, sidebars, etc)
    router.refresh();
  };

  // Mount recovery: check localStorage/cookie once on initial mount
  useEffect(() => {
    setMounted(true);

    const getCookie = (name: string) => {
      if (typeof document === "undefined") return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
      return null;
    };

    try {
      const savedLang = (localStorage.getItem("app-language") || getCookie("app-language")) as Language;
      if (savedLang && ["th", "en", "cn", "ru"].includes(savedLang)) {
        if (savedLang !== language) {
          setLanguageState(savedLang);
        }
        return;
      }

      // Auto-detect browser language only if NO user preference has ever been set
      const browserLang = navigator.language?.split("-")[0];
      const supportedLangs: Language[] = ["th", "en", "cn", "ru"];
      if (supportedLangs.includes(browserLang as Language)) {
        setLanguageState(browserLang as Language);
        localStorage.setItem("app-language", browserLang);
        document.cookie = `app-language=${browserLang}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } catch {
      // Fallback
    }
  }, []);


  // Synchronize browser document.title in real-time when language changes
  useEffect(() => {
    if (typeof window === "undefined" || !document) return;

    const pathname = window.location.pathname;
    const dict = dictionaries[language];
    const siteName = "VCC ASSET";

    if (pathname === "/" || pathname === "") {
      const homeTitle = getNestedValue(dict, "metadata.home_title");
      if (homeTitle && !homeTitle.includes("metadata.")) {
        document.title = homeTitle.replace("{siteName}", siteName);
      }
    } else if (pathname.includes("/properties/luxury-villa")) {
      const l1 = getNestedValue(dict, "silo_landing.luxury_villa.title_line1");
      const l2 = getNestedValue(dict, "silo_landing.luxury_villa.title_line2");
      document.title = l1 && !l1.includes("silo_landing.")
        ? `${l1} ${l2 || ""} | ${siteName}`
        : getNestedValue(dict, "metadata.luxury_villa_title")?.replace("{siteName}", siteName) || document.title;
    } else if (pathname.includes("/properties/pet-friendly-condo")) {
      const l1 = getNestedValue(dict, "silo_landing.pet_friendly.title_line1");
      const l2 = getNestedValue(dict, "silo_landing.pet_friendly.title_line2");
      document.title = l1 && !l1.includes("silo_landing.")
        ? `${l1} - ${l2 || ""} | ${siteName}`
        : getNestedValue(dict, "metadata.pet_friendly_condo_title")?.replace("{siteName}", siteName) || document.title;
    } else if (pathname.includes("/properties/office-for-rent")) {
      const l1 = getNestedValue(dict, "silo_landing.office_for_rent.title_line1");
      const l2 = getNestedValue(dict, "silo_landing.office_for_rent.title_line2");
      document.title = l1 && !l1.includes("silo_landing.")
        ? `${l1} ${l2 || ""} | ${siteName}`
        : getNestedValue(dict, "metadata.office_for_rent_title")?.replace("{siteName}", siteName) || document.title;
    } else if (pathname === "/properties" || pathname.startsWith("/properties/")) {
      const propTitle = getNestedValue(dict, "metadata.properties_title") || getNestedValue(dict, "metadata.default_title");
      if (propTitle && !propTitle.includes("metadata.")) {
        document.title = propTitle.replace("{siteName}", siteName);
      }
    } else if (pathname === "/blog" || pathname === "/blogs") {
      const blogTitle = getNestedValue(dict, "metadata.blog_title");
      if (blogTitle && !blogTitle.includes("metadata.")) {
        document.title = blogTitle.replace("{siteName}", siteName);
      }
    } else if (pathname === "/about") {
      const aboutTitle = getNestedValue(dict, "metadata.about_title") || `${getNestedValue(dict, "nav.about")} | ${siteName}`;
      if (aboutTitle) document.title = aboutTitle.replace("{siteName}", siteName);
    } else if (pathname === "/contact") {
      const contactTitle = getNestedValue(dict, "metadata.contact_title") || `${getNestedValue(dict, "nav.contact")} | ${siteName}`;
      if (contactTitle) document.title = contactTitle.replace("{siteName}", siteName);
    } else if (pathname === "/projects" || pathname.startsWith("/projects/")) {
      const projectsTitle = getNestedValue(dict, "metadata.projects_title") || `${getNestedValue(dict, "nav.projects") || "Projects"} | ${siteName}`;
      if (projectsTitle) document.title = projectsTitle.replace("{siteName}", siteName);
    }
  }, [language, mounted]);



  const t = (key: string, params?: Record<string, string | number>) => {
    const dict = dictionaries[language];
    let value = getNestedValue(dict, key);

    if (params && typeof value === "string") {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, String(v));
      });
    }

    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback instead of crash to help debug
    console.warn(
      "useLanguage used outside of LanguageProvider. Providing fallback.",
    );
    return {
      language: "th" as Language,
      setLanguage: () => {},
      t: (key: string, params?: Record<string, string | number>) => {
        let value = key;
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            value = value.replace(`{${k}}`, String(v));
          });
        }
        return value;
      },
    };
  }
  return context;
}
