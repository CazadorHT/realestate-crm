"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import Image from "next/image";

interface PetFriendlyFeatureCardsProps {
  initialLanguage?: string;
}

export function PetFriendlyFeatureCards({ initialLanguage }: PetFriendlyFeatureCardsProps) {
  const { language: clientLanguage, t } = useLanguage();
  const language = clientLanguage || initialLanguage || "th";

  return (
    <section className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 mb-16 mt-12 animate-fade-in-up delay-100">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
        <h2 className="text-3xl font-semibold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-orange-600 to-amber-600 md:text-4xl">
          {t("silo_landing.pet_friendly.intro_title")}
        </h2>
        <p className="text-slate-500 font-medium text-sm md:text-base leading-relaxed">
          {t("silo_landing.pet_friendly.intro_desc")}
        </p>
        <div className="flex justify-center items-center gap-1.5 pt-3 opacity-60">
          {/* SVG Paw Prints */}
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-orange-500">
            <path d="M12 14c-1.66 0-3 1.34-3 3 0 2 2 3.5 3 4.5 1-1 3-2.5 3-4.5 0-1.66-1.34-3-3-3zm-4.5-3c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm9 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm-6.75-4c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm4.5 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25z" />
          </svg>
          <div className="h-px w-12 bg-orange-200" />
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-amber-500">
            <path d="M12 14c-1.66 0-3 1.34-3 3 0 2 2 3.5 3 4.5 1-1 3-2.5 3-4.5 0-1.66-1.34-3-3-3zm-4.5-3c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm9 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm-6.75-4c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm4.5 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25z" />
          </svg>
          <div className="h-px w-12 bg-orange-200" />
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-orange-500">
            <path d="M12 14c-1.66 0-3 1.34-3 3 0 2 2 3.5 3 4.5 1-1 3-2.5 3-4.5 0-1.66-1.34-3-3-3zm-4.5-3c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm9 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm-6.75-4c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm4.5 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25z" />
          </svg>
        </div>
      </div>

      {/* Features 4-Column Grid Layout (Compact & Premium) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mt-8">
        {/* Card 1: Dog playground */}
        <div className="group bg-white rounded-3xl border border-slate-100/80 p-5 flex flex-col shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="relative w-full aspect-video mb-4 shrink-0">
            <Image
              src="/images/pet/dog_play.webp"
              alt={t("silo_landing.pet_friendly.dog_title")}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="space-y-2 flex-1 flex flex-col">
            <h3 className="text-md font-semibold text-slate-800 flex items-center gap-1.5">
              {t("silo_landing.pet_friendly.dog_title")}
            </h3>
            <p className="text-xs font-medium text-slate-500 leading-relaxed flex-1">
              {t("silo_landing.pet_friendly.dog_desc")}
            </p>
          </div>
        </div>

        {/* Card 2: Cat zone */}
        <div className="group bg-white rounded-3xl border border-slate-100/80 p-5 flex flex-col shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="relative w-full aspect-video mb-4 shrink-0">
            <Image
              src="/images/pet/cat_play.webp"
              alt={t("silo_landing.pet_friendly.cat_title")}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="space-y-2 flex-1 flex flex-col">
            <h3 className="text-md font-semibold text-slate-800 flex items-center gap-1.5">
              {t("silo_landing.pet_friendly.cat_title")}
            </h3>
            <p className="text-xs font-medium text-slate-500 leading-relaxed flex-1">
              {t("silo_landing.pet_friendly.cat_desc")}
            </p>
          </div>
        </div>

        {/* Card 3: Smart Interior Design */}
        <div className="group bg-white rounded-3xl border border-slate-100/80 p-5 flex flex-col shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="relative w-full aspect-video mb-4 shrink-0">
            <Image
              src="/images/pet/play.webp"
              alt={t("silo_landing.pet_friendly.design_title")}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="space-y-2 flex-1 flex flex-col">
            <h3 className="text-md font-semibold text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              {t("silo_landing.pet_friendly.design_title")}
            </h3>
            <p className="text-xs font-medium text-slate-500 leading-relaxed flex-1">
              {t("silo_landing.pet_friendly.design_desc")}
            </p>
          </div>
        </div>

        {/* Card 4: Pet Healthcare / Community */}
        <div className="group bg-white rounded-3xl border border-slate-100/80 p-5 flex flex-col shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="relative w-full aspect-video mb-4 shrink-0">
            <Image
              src="/images/pet/love_pet.webp"
              alt={t("silo_landing.pet_friendly.health_title")}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="space-y-2 flex-1 flex flex-col">
            <h3 className="text-md font-semibold text-slate-800 flex items-center gap-1.5">
              {t("silo_landing.pet_friendly.health_title")}
            </h3>
            <p className="text-xs font-medium text-slate-500 leading-relaxed flex-1">
              {t("silo_landing.pet_friendly.health_desc")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
