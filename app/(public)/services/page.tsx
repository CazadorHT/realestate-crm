import { Metadata } from "next";
import ServicesPageClient from "./ServicesPageClient";

import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  const canonicalUrl = `${siteConfig.url}/services`;

  return {
    title: t("metadata.services_title", { siteName: siteConfig.name }),
    description: t("metadata.services_description"),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "th-TH": `${canonicalUrl}?lang=th`,
        "en-US": `${canonicalUrl}?lang=en`,
        "zh-CN": `${canonicalUrl}?lang=cn`,
        "x-default": canonicalUrl,
      },
    },
  };
}

export default function ServicesPage() {
  return <ServicesPageClient />;
}
