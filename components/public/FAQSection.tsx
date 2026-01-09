"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CircleHelp, MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

export function FAQSection() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFAQs() {
      const supabase = createClient();
      const { data } = await supabase
        .from("faqs")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(5);

      if (data) {
        setFaqs(data as FAQ[]);
      }
      setLoading(false);
    }
    fetchFAQs();
  }, []);

  // if (loading) return null; // Removed to prevent layout shift
  if (!loading && faqs.length === 0) return null;

  // Schema.org FAQPage Structure
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <section
      className="py-24 relative overflow-hidden bg-slate-900"
      data-aos="fade-up"
    >
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]" />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-blue-400 text-sm font-medium mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            <span>Help Center & Support</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            มีคำถาม?{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              เรามีคำตอบ
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            รวมคำถามที่พบบ่อยเกี่ยวกับการซื้อ-ขาย-เช่า และสินเชื่อ
            เพื่อให้คุณมั่นใจในทุกขั้นตอน
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {loading
            ? Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="space-y-4">
                  {/* Left Skeleton (Question) */}
                  <div className="flex justify-start">
                    <Skeleton className="h-20 w-3/4 max-w-2xl rounded-2xl rounded-tl-sm bg-white/5" />
                  </div>
                </div>
              ))
            : faqs.map((faq, index) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="border-none group"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  {/* Question Bubble (Left) */}
                  <div className="flex justify-start mb-2">
                    <AccordionTrigger
                      className={cn(
                        "hover:no-underline py-0 inline-flex",
                        "[&[data-state=open]>div]:rounded-bl-none [&[data-state=open]>div]:bg-white/10" // Adjust shape/color when open
                      )}
                    >
                      <div className="flex items-start gap-4 p-5 rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 max-w-2xl text-left group-data-[state=open]:ring-1 group-data-[state=open]:ring-blue-500/50">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 mt-0.5">
                          <CircleHelp className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-medium text-white leading-snug">
                            {faq.question}
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                  </div>

                  {/* Answer Bubble (Right) */}
                  <AccordionContent className="pb-4 pt-2">
                    <div className="flex justify-end pl-12 md:pl-24">
                      <div className="flex items-start gap-4 p-6 rounded-2xl rounded-tr-sm bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/10 max-w-2xl backdrop-blur-md">
                        <div className="flex-1 text-right">
                          <p className="text-slate-300 leading-relaxed text-base">
                            {faq.answer}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 mt-0.5">
                          <MessageCircle className="w-5 h-5 text-blue-400" />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
        </Accordion>
      </div>
    </section>
  );
}
