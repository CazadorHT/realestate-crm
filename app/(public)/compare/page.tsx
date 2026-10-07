import { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { getSeoAlternates } from "@/lib/seo-utils";
import { getServerTranslations } from "@/lib/i18n";
import ComparePageClient from "./ComparePageClient";

export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();

  const title = t("metadata.compare_title", { siteName: siteConfig.name });
  const description = t("metadata.compare_description");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/compare`,
      siteName: siteConfig.name,
      type: "website",
    },
    alternates: getSeoAlternates("/compare"),
  };
}

export default function ComparePage() {
  return <ComparePageClient />;
}
