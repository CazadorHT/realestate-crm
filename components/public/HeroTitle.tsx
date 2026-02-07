"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function HeroTitle() {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);

  // Get words from translation, fallback to empty array if not found or not array
  const words = (t("home.hero.words") as unknown as string[]) || [];

  useEffect(() => {
    if (words.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [words.length]);

  return (
    <div className="flex">
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
        <p className="inline-block text-white">{t("home.hero.hero_find")}</p>

        <div className="inline-block ml-2 sm:ml-3 relative">
          <span
            key={index}
            className="bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-8 duration-700 flex items-center h-full leading-normal"
          >
            {words[index] || ""}
          </span>
        </div>
        <div className="bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent leading-normal">
          {t("home.hero.hero_for_you")}
        </div>
      </h1>
    </div>
  );
}
