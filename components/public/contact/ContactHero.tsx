"use client";

import { MessageSquare } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function ContactHero() {
  const { t } = useLanguage();
  return (
    <section className="relative min-h-[40vh] flex items-center bg-slate-950 text-white py-20 md:py-32 overflow-hidden">
      {/* Mesh Background Effect */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,hsl(var(--brand-primary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,hsl(var(--brand-secondary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--brand-primary)/0.05),transparent_70%)]" />

        {/* Subtle Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] mask-image:radial-gradient(ellipse_at_center,black_transparent_80%)"
          style={{
            backgroundImage:
              "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Animated Background Blobs - More Dynamic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-[hsl(var(--brand-primary)/0.2)] rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-blob" />
        <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-[hsl(var(--brand-secondary)/0.2)] rounded-full mix-blend-screen filter blur-[80px] opacity-40 animate-blob animation-delay-2000" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-4 bg-white/5 backdrop-blur-xl rounded-2xl mb-8 shadow-2xl border border-white/10 group hover:border-[hsl(var(--brand-primary)/0.3)] transition-all duration-500 scale-110">
            <div className="relative">
              <div className="absolute inset-0 bg-[hsl(var(--brand-primary))] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <MessageSquare className="w-10 h-10 text-[hsl(var(--brand-primary))] relative z-10" />
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold mb-8 tracking-tighter">
            <span className="inline-block animate-in fade-in slide-in-from-bottom-4 duration-700">
              {t("contact.hero_title").split(" ").slice(0, -1).join(" ")}{" "}
            </span>
            <span className="text-transparent bg-clip-text bg-[linear-gradient(135deg,hsl(var(--brand-primary)),hsl(var(--brand-secondary)))] animate-in fade-in slide-in-from-bottom-6 duration-1000">
              {t("contact.hero_title").split(" ").pop()}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300/90 max-w-3xl mx-auto leading-relaxed font-light animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {t("contact.hero_desc")}
          </p>
        </div>
      </div>
    </section>
  );
}
