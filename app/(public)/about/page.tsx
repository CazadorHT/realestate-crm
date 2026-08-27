import { Metadata } from "next";
import AboutPageClient from "./AboutPageClient";

import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";

export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("metadata.about_title", { siteName: siteConfig.name }),
    description: t("metadata.about_description"),
  };
}

export default function AboutPage() {
  return <AboutPageClient />;
}
