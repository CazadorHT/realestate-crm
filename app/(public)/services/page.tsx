import { Metadata } from "next";
import ServicesPageClient from "./ServicesPageClient";

import { siteConfig } from "@/lib/site-config";
import { getSeoAlternates } from "@/lib/seo-utils";
import { getServerTranslations, getLangPrefix } from "@/lib/i18n";

export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

export async function generateMetadata(): Promise<Metadata> {
  const { t, language } = await getServerTranslations();
  const langPrefix = getLangPrefix(language);

  return {
    title: {
      absolute: t("metadata.services_title", { siteName: siteConfig.name }),
    },
    description: t("metadata.services_description"),
    alternates: getSeoAlternates(`${langPrefix}/services`),
  };
}

export default function ServicesPage() {
  return <ServicesPageClient />;
}
