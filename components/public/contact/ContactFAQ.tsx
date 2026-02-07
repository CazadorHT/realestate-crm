"use client";

import { Clock, MessageCircle, CreditCard, Calendar } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function ContactFAQ() {
  const { t } = useLanguage();

  const faqData = [
    {
      question: t("contact.faq_q1"),
      answer: t("contact.faq_a1"),
      icon: Clock,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      question: t("contact.faq_q2"),
      answer: t("contact.faq_a2"),
      icon: MessageCircle,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      question: t("contact.faq_q3"),
      answer: t("contact.faq_a3"),
      icon: CreditCard,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
    {
      question: t("contact.faq_q4"),
      answer: t("contact.faq_a4"),
      icon: Calendar,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
  ];

  return (
    <section className="mt-16 mb-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          {t("contact.faq_title")}
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          {t("contact.faq_desc")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto px-4">
        {faqData.map((faq, index) => {
          const Icon = faq.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`shrink-0 w-12 h-12 rounded-xl ${faq.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={`w-6 h-6 ${faq.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-slate-900 mb-2 group-hover:text-primary transition-colors">
                    {faq.question}
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
