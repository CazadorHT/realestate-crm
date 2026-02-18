import { Metadata } from "next";
import ServicesPageClient from "./ServicesPageClient";

import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("metadata.services_title", { siteName: siteConfig.name }),
    description: t("metadata.services_description"),
  };
}

export default function ServicesPage() {
  return <ServicesPageClient />;
}
