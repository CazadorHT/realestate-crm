"use client";

import { useState } from "react";
import { useLanguage, Language } from "@/components/providers/LanguageProvider";

export interface LocalizedText {
  th?: string;
  en?: string;
  cn?: string;
  ru?: string;
}

export interface FaqItem {
  q: string | LocalizedText;
  a: string | LocalizedText;
}

interface FaqAccordionProps {
  title: string | LocalizedText;
  items: FaqItem[];
  theme?: "light" | "dark";
}

function resolveText(val: string | LocalizedText | undefined, lang: Language): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val[lang] || val.en || val.th || Object.values(val)[0] || "";
}

export function FaqAccordion({ title, items, theme = "light" }: FaqAccordionProps) {
  const { language } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const isDark = theme === "dark";
  const displayTitle = resolveText(title, language);

  return (
    <section className={`max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 pb-30 mt-16 pt-16 ${isDark ? "border-t border-slate-800/80" : "border-t border-slate-100"}`}>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className={`text-2xl md:text-3xl font-black ${isDark ? "text-white" : "text-slate-800"}`}>
            {displayTitle}
          </h2>
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider">
            {language === "en" ? "Answers to Common Questions" :
             language === "cn" ? "常见问题解答" :
             language === "ru" ? "Ответы на часто задаваемые вопросы" :
             "คำถามที่พบบ่อย"}
          </p>
        </div>

        <div className="space-y-4">
          {items.map((item, idx) => {
            const isOpen = openIndex === idx;
            const qText = resolveText(item.q, language);
            const aText = resolveText(item.a, language);

            return (
              <div 
                key={idx}
                className={`rounded-2xl border p-6 transition-all duration-200 ${
                  isDark
                    ? "bg-slate-900/60 border-slate-800/80 shadow-lg hover:border-slate-700"
                    : "bg-white border-slate-100 shadow-2xs hover:shadow-xs"
                }`}
              >
                <button
                  onClick={() => toggle(idx)}
                  className={`w-full flex items-center justify-between font-bold text-left cursor-pointer select-none ${
                    isDark ? "text-white" : "text-slate-800"
                  }`}
                >
                  <span className="text-base md:text-lg pr-4">{qText}</span>
                  <span className={`shrink-0 transition-colors duration-200 ${isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-400 hover:text-slate-600"}`}>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      strokeWidth="2.5" 
                      stroke="currentColor" 
                      className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </button>
                <div 
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className={`mt-4 text-sm font-medium leading-relaxed pt-4 ${
                      isDark 
                        ? "text-slate-300 border-t border-slate-800/80" 
                        : "text-slate-500 border-t border-slate-50/80"
                    }`}>
                      {aText}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

