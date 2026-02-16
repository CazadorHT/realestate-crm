import { Metadata } from "next";
import ServicesPageClient from "./ServicesPageClient";

import { getServerTranslations } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("metadata.services_title"),
    description: t("metadata.services_description"),
  };
}

export default function ServicesPage() {
  return <ServicesPageClient />;
}
