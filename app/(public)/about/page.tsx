import { Metadata } from "next";
import AboutPageClient from "./AboutPageClient";

import { siteConfig } from "@/lib/site-config";
import { getSeoAlternates } from "@/lib/seo-utils";
import { getServerTranslations, getLangPrefix } from "@/lib/i18n";

export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

export async function generateMetadata(): Promise<Metadata> {
  const { t, language } = await getServerTranslations();
  const langPrefix = getLangPrefix(language);
  return {
    title: t("metadata.about_title", { siteName: siteConfig.name }),
    description: t("metadata.about_description"),
    alternates: getSeoAlternates(`${langPrefix}/about`),
  };
}

export default function AboutPage() {
  return <AboutPageClient />;
}
