"use client";

import { useState, useRef, useEffect } from "react";
import { BsStars } from "react-icons/bs";
import { ChevronDown, ChevronUp } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getLocaleValue } from "@/lib/utils/locale-utils";

interface PropertyDescriptionProps {
  property: {
    description: string | null;
    description_en?: string | null;
    description_cn?: string | null;
  };
}

export function PropertyDescription({ property }: PropertyDescriptionProps) {
  const { language, t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const THRESHOLD_HEIGHT = 280;

  const localizedDescription = getLocaleValue(
    property,
    "description",
    language,
  );

  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setShouldShowButton(height > THRESHOLD_HEIGHT);
    }
  }, [localizedDescription]);

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
    setIsExpanded(!isExpanded);
  };

  return (
    <section ref={sectionRef} className="scroll-mt-24">
      <h2 className="text-lg md:text-xl border-l-4 border-blue-600 bg-linear-to-r from-blue-50 to-white px-4 py-3 rounded-r-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
        <BsStars className="w-5 h-5 text-blue-600" />
        {t("property.details")}
      </h2>

      <div className="relative">
        <div
          ref={contentRef}
          className={`prose prose-slate max-w-none text-slate-600 leading-5 text-sm md:text-base transition-all duration-500 ease-in-out border-b border-slate-200/60 pb-10 overflow-hidden ${
            !isExpanded && shouldShowButton ? "max-h-[500px]" : "max-h-[2000px]"
          }`}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              localizedDescription || t("property.no_description"),
            ),
          }}
        />

        {!isExpanded && shouldShowButton && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-white via-white/80 to-transparent pointer-events-none" />
        )}
      </div>

      {shouldShowButton && (
        <div className="flex justify-center mt-4 mb-2">
          <button
            onClick={handleToggle}
            className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors py-2 px-4 rounded-full bg-blue-50 hover:bg-blue-100 shadow-sm border border-blue-100 cursor-pointer"
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
