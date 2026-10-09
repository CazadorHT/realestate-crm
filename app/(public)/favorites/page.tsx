import { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { getSeoAlternates } from "@/lib/seo-utils";
import { getServerTranslations } from "@/lib/i18n";
import FavoritesPageClient from "./FavoritesPageClient";

export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();

  const title = t("metadata.favorites_title", { siteName: siteConfig.name });
  const description = t("metadata.favorites_description");

  return {
    title: {
      absolute: title,
    },
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/favorites`,
      siteName: siteConfig.name,
      type: "website",
    },
    alternates: getSeoAlternates("/favorites"),
  };
}

export default function FavoritesPage() {
  return <FavoritesPageClient />;
}
