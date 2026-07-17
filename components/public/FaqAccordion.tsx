"use client";

import { useState } from "react";

import { useLanguage } from "@/components/providers/LanguageProvider";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  title: string;
  items: FaqItem[];
}

export function FaqAccordion({ title, items }: FaqAccordionProps) {
  const { language } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 pb-30 mt-16 border-t border-slate-100 pt-16">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-slate-800">
            {title}
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
            return (
              <div 
                key={idx}
                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs hover:shadow-xs transition-all duration-200"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between font-bold text-slate-800 text-left cursor-pointer select-none"
                >
                  <span className="text-base md:text-lg pr-4">{item.q}</span>
                  <span className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors duration-200">
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
                    <div className="mt-4 text-sm font-medium text-slate-500 leading-relaxed border-t border-slate-50/80 pt-4">
                      {item.a}
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
