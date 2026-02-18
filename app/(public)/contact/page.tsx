import { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";

import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("metadata.contact_title", { siteName: siteConfig.name }),
    description: t("metadata.contact_description"),
  };
}

export default function ContactPage() {
  return <ContactPageClient />;
}
