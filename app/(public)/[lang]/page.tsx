import { notFound } from "next/navigation";
import { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { getServerTranslations, normalizeLocale } from "@/lib/i18n";

// Reuse main homepage logic
import PublicHomePage, { generateMetadata as baseGenerateMetadata } from "../page";

export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

const VALID_FOREIGN_LANGS = ["en", "zh", "ru"];

export function generateStaticParams() {
  return [
    { lang: "en" },
    { lang: "zh" },
    { lang: "ru" },
  ];
}

/**
 * [S-Tier] Multilingual Public Home Page (/en, /zh, /ru)
 * 100% Static ISR Edge Caching with Zero Fast Origin DB Egress
 */
export default async function MultilingualHomePage(props: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await props.params;
  const normalizedLang = lang?.toLowerCase();

  if (!VALID_FOREIGN_LANGS.includes(normalizedLang)) {
    notFound();
  }

  // Reuses the core page components with zero runtime overhead
  return <PublicHomePage locale={normalizedLang} />;
}

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await props.params;
  const normalizedLang = lang?.toLowerCase();

  if (!VALID_FOREIGN_LANGS.includes(normalizedLang)) {
    return {};
  }

  const internalLocale = normalizeLocale(normalizedLang);
  const { t, language } = await getServerTranslations(internalLocale);

  const localeMap: Record<string, string> = {
    th: "th_TH",
    en: "en_US",
    cn: "zh_CN",
    ru: "ru_RU",
  };
  const currentLocale = localeMap[language] || "en_US";

  const canonicalUrl = `${siteConfig.url}/${normalizedLang}`;

  return {
    title: t("metadata.home_title", { siteName: siteConfig.name }),
    description: t("metadata.home_description"),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        th: `${siteConfig.url}/`,
        en: `${siteConfig.url}/en`,
        "zh-Hans": `${siteConfig.url}/zh`,
        ru: `${siteConfig.url}/ru`,
        "x-default": `${siteConfig.url}/`,
      },
    },
    openGraph: {
      type: "website",
      locale: currentLocale,
      url: canonicalUrl,
      title: t("metadata.home_title", { siteName: siteConfig.name }),
      description: t("metadata.home_description"),
      siteName: siteConfig.name,
      images: [`${siteConfig.url}${siteConfig.ogImage}`],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metadata.home_title", { siteName: siteConfig.name }),
      description: t("metadata.home_description"),
      images: [`${siteConfig.url}${siteConfig.ogImage}`],
    },
  };
}
