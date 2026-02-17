import { Metadata } from "next";
import AboutPageClient from "./AboutPageClient";

import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";

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
