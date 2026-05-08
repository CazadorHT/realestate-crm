"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { m, AnimatePresence } from "framer-motion";

export function HeroTitle() {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [isInitial, setIsInitial] = useState(true);

  // Get words from translation, fallback to empty array if not found or not array
  const words = (t("home.hero.words") as unknown as string[]) || [];

  useEffect(() => {
    if (words.length <= 1) return;
    
    const timer = setInterval(() => {
      setIsInitial(false);
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    
    return () => clearInterval(timer);
  }, [words.length]);

  return (
    <div className="flex justify-center lg:justify-start text-center lg:text-left w-full">
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold leading-tight flex flex-col items-center lg:block">
        <span className="text-white lg:inline-block">{t("home.hero.hero_find")}</span>
        <span className="relative inline-flex items-center lg:ml-3 h-[1.1em] md:h-[1.2em] overflow-hidden align-middle">
          <AnimatePresence mode="wait">
            <m.span
              key={index}
              initial={isInitial ? false : { y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.23, 1, 0.32, 1] // Premium ease-out
              }}
              className="bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent leading-none whitespace-nowrap inline-block"
            >
              {words[index] || words[0] || ""}
            </m.span>
          </AnimatePresence>
        </span>
        <span className="bg-linear-to-r text-white bg-clip-text leading-normal lg:block">
          {t("home.hero.hero_for_you")}
        </span>
      </h1>
    </div>
  );
}
