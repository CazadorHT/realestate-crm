"use client";

import { useState, useRef, useEffect } from "react";
import { BsStars } from "react-icons/bs";
import { ChevronDown, ChevronUp } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import {
  useLanguage,
  dictionaries,
} from "@/components/providers/LanguageProvider";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { updateAIScore } from "@/lib/analytics-utils";
import { type Language } from "@/lib/i18n";

interface PropertyDescriptionProps {
  property: {
    description: string | null;
    description_en?: string | null;
    description_cn?: string | null;
    description_ru?: string | null;
    id?: string;
    title?: string;
  };
  language?: Language;
}

export function PropertyDescription({
  property,
  language: customLanguage,
}: PropertyDescriptionProps) {
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = customLanguage || globalLanguage;

  // Custom t function for language override
  const t = (key: string) => {
    if (!customLanguage) return globalT(key);
    const dict = dictionaries[language as keyof typeof dictionaries] as any;
    return key.split(".").reduce((prev, curr) => prev?.[curr], dict) || key;
  };
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const THRESHOLD_HEIGHT = 300;

  const localizedDescription = getLocaleValue(
    property,
    "description",
    language,
  );

  const [sanitizedDescription, setSanitizedDescription] = useState<string>(
    localizedDescription || "",
  );

  useEffect(() => {
    if (!localizedDescription) {
      setSanitizedDescription("");
      return;
    }

    // Client-side only sanitization to avoid jsdom/SSR overhead and crashes
    import("dompurify").then((module) => {
      const DOMPurify = module.default;
      setSanitizedDescription(DOMPurify.sanitize(localizedDescription));
    });
  }, [localizedDescription]);

  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setShouldShowButton(height > THRESHOLD_HEIGHT);
    }
  }, [sanitizedDescription]);

  const handleToggle = () => {
    if (isExpanded && sectionRef.current) {
      // Scroll to top of section when collapsing
      const offset = 80; // Adjust for sticky header if needed
      const elementPosition = sectionRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    
    // Track expansion
    if (!isExpanded) {
      try {
        pushToDataLayer(GTM_EVENTS.EXPAND_DESCRIPTION, {
          item_id: property.id,
          item_name: property.title,
        });
        updateAIScore(3);
      } catch (e) {}
    }
    
    setIsExpanded(!isExpanded);
  };

  return (
    <section ref={sectionRef} className="scroll-mt-24">
      <h2 className="text-lg md:text-xl border-l-4 border-blue-600 bg-linear-to-r from-blue-50 to-white px-4 py-3 rounded-r-xl font-semibold text-blue-900 mb-6 flex items-center gap-2">
        <BsStars className="w-5 h-5 text-blue-600" />
        {t("property.details")}
      </h2>

      <div className="relative">
        <m.div
          ref={contentRef}
          initial={false}
          animate={{ 
            height: !isExpanded && shouldShowButton ? THRESHOLD_HEIGHT : "auto",
          }}
          transition={{ 
            type: "spring",
            stiffness: 40,
            damping: 20,
            mass: 1.5,
            restDelta: 0.5
          }}
          className="prose prose-slate max-w-none text-slate-600 leading-normal text-sm md:text-base border-b border-slate-200/60 pb-10 overflow-hidden"
          dangerouslySetInnerHTML={{
            __html: sanitizedDescription || t("property.no_description"),
          }}
        />

        <AnimatePresence>
          {!isExpanded && shouldShowButton && (
            <m.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-white via-white/80 to-transparent pointer-events-none" 
            />
          )}
        </AnimatePresence>
      </div>

      {shouldShowButton && (
        <div className="flex justify-center mt-4 mb-2">
          <button
            onClick={handleToggle}
            className="flex items-center gap-2 text-blue-600 font-semibold hover:text-white transition-all duration-300 py-2 px-4 rounded-full bg-blue-50 hover:bg-blue-500 shadow-sm hover:border-blue-500 hover:scale-105 border hover:shadow-lg border-blue-100 cursor-pointer"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                {t("common.show_less")}
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                {t("common.read_more")}
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
