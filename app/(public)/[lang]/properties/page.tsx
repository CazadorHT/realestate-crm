import { notFound } from "next/navigation";
import { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { getServerTranslations, normalizeLocale } from "@/lib/i18n";

// Reuse main properties page logic
import PublicPropertiesPage from "@/app/(public)/properties/page";

export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

const VALID_FOREIGN_LANGS = ["en", "zh", "ru"];

/**
 * [S-Tier] Multilingual Public Properties Catalog Page (/en/properties, /zh/properties, /ru/properties)
 * 100% Static ISR Edge Caching with Zero Fast Origin DB Egress
 */
export default async function MultilingualPropertiesPage(props: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<any>;
}) {
  const { lang } = await props.params;
  const normalizedLang = lang?.toLowerCase();

  if (!VALID_FOREIGN_LANGS.includes(normalizedLang)) {
    notFound();
  }

  return <PublicPropertiesPage searchParams={props.searchParams} />;
}

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<any>;
}): Promise<Metadata> {
  const { lang } = await props.params;
  const normalizedLang = lang?.toLowerCase();

  if (!VALID_FOREIGN_LANGS.includes(normalizedLang)) {
    return {};
  }

  const internalLocale = normalizeLocale(normalizedLang);
  const { t } = await getServerTranslations(internalLocale);

  const canonicalUrl = `${siteConfig.url}/${normalizedLang}/properties`;

  return {
    title: t("metadata.properties_title") || "Properties for Sale & Rent in Thailand",
    description: t("metadata.properties_description") || "Explore verified condos, houses, and luxury properties in Bangkok.",
    alternates: {
      canonical: canonicalUrl,
      languages: {
        th: `${siteConfig.url}/properties`,
        en: `${siteConfig.url}/en/properties`,
        "zh-Hans": `${siteConfig.url}/zh/properties`,
        ru: `${siteConfig.url}/ru/properties`,
        "x-default": `${siteConfig.url}/properties`,
      },
    },
  };
}
