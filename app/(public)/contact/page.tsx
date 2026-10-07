import { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";

import { siteConfig } from "@/lib/site-config";
import { getSeoAlternates } from "@/lib/seo-utils";
import { getServerTranslations, getLangPrefix } from "@/lib/i18n";
import { getSiteSettings } from "@/features/site-settings/actions";

export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

export async function generateMetadata(): Promise<Metadata> {
  const { t, language } = await getServerTranslations();
  const langPrefix = getLangPrefix(language);
  return {
    title: t("metadata.contact_title", { siteName: siteConfig.name }),
    description: t("metadata.contact_description"),
    alternates: getSeoAlternates(`${langPrefix}/contact`),
  };
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const googleMapsUrl = settings.google_maps_url || siteConfig.googleMapsUrl;

  return <ContactPageClient googleMapsUrl={googleMapsUrl} />;
}
