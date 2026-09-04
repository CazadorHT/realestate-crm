"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Mail, MessageSquare, Sparkles } from "lucide-react";
import { m } from "framer-motion";
import Image from "next/image";

export function ContactHero({ 
  body, 
  footer 
}: { 
  body?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[80vh] lg:min-h-screen pt-24 lg:pt-32 pb-24 lg:pb-40 flex flex-col items-center text-white bg-slate-950">
      {/* Background Image with Premium Overlays */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-linear-to-b from-slate-950/90 via-slate-950/40 to-slate-950" />
        <div className="absolute inset-0 bg-linear-to-r from-blue-900/40 via-transparent to-purple-900/40" />
      </div>

      {/* Floating Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <m.div 
          animate={{ 
            y: [0, -40, 0],
            rotate: [0, 10, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-10 w-48 lg:w-96 h-48 lg:h-96 bg-blue-500/10 rounded-full blur-3xl opacity-50"
        />
        <m.div 
          animate={{ 
            y: [0, 40, 0],
            rotate: [0, -10, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-10 w-64 lg:w-[500px] h-64 lg:h-[500px] bg-purple-500/10 rounded-full blur-3xl opacity-60"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-30 w-full">
        <div className="flex flex-col gap-8 lg:gap-16">
          {/* Main Content Grid: Text + Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16 items-center mt-6 lg:mt-0">
            {/* Left Side: Messaging */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <m.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className="inline-flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 bg-white/20 rounded-full mb-4 lg:mb-8 shadow-lg border border-white/30"
              >
                <Sparkles className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-blue-300" />
                <span className="text-[10px] lg:text-xs font-medium uppercase tracking-widest text-blue-50">
                  {t("contact.title_badge") || "Get in Touch"}
                </span>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "circOut" }}
              >
                <h1 className="text-3xl sm:text-4xl lg:text-7xl font-semibold mb-3 lg:mb-8 tracking-tighter leading-tight drop-shadow-2xl">
                  {t("contact.hero_title")}
                </h1>
              </m.div>

              <m.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: "circOut" }}
                className="text-sm text-blue-100/90 leading-relaxed font-medium"
              >
                {t("contact.hero_desc")}
              </m.p>
            </div>

            {/* Right Side: Integrated Body (Form) */}
            <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
              {body}
            </div>
          </div>

          {/* Integrated Footer (Info Cards) */}
          {footer && (
            <m.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8, ease: "circOut" }}
              className="w-full"
            >
              {footer}
            </m.div>
          )}
        </div>
      </div>
      
      {/* Scroll Indicator or Final Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-slate-950 to-transparent z-20 pointer-events-none" />
    </section>
  );
}
