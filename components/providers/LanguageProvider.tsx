"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import th from "@/i18n/locales/th.json";
import en from "@/i18n/locales/en.json";
import cn from "@/i18n/locales/cn.json";

type Language = "th" | "en" | "cn";
type Translations = typeof th;

// Helper to access nested keys "nav.home"
function getNestedValue(obj: any, path: string): string {
  return path.split(".").reduce((prev, curr) => prev?.[curr], obj) || path;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const dictionaries = { th, en, cn };

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("th");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("app-language") as Language;
    if (saved && ["th", "en", "cn"].includes(saved)) {
      setLanguageState(saved);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
    // Optional: Reload to refresh server components/metadata if needed later
    // window.location.reload();
  };

  const t = (key: string) => {
    const dict = dictionaries[language];
    return getNestedValue(dict, key);
  };

  // We must always wrap children in Provider to avoid "useLanguage must be used within a LanguageProvider" error
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
