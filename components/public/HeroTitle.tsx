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
    <div className="flex justify-center lg:justify-start text-center lg:text-left w-full">
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold leading-tight flex flex-col items-center lg:block">
        <p className="text-white lg:inline-block">{t("home.hero.hero_find")}</p>
        <div className="relative lg:inline-block lg:ml-3">
          <span
            key={index}
            className="bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-8 duration-700 leading-normal flex items-center h-full whitespace-nowrap"
          >
            {words[index] || ""}
          </span>
        </div>
        <div className="bg-linear-to-r text-white bg-clip-text leading-normal lg:block">
          {t("home.hero.hero_for_you")}
        </div>
      </h1>
    </div>
  );
}
