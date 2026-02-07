"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

export default function AboutPage() {
  const { t } = useLanguage();
  return (
    <main className="max-w-screen-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900">{t("about.title")}</h1>
      <p className="mt-3 text-slate-600">{t("about.description")}</p>
    </main>
  );
}
