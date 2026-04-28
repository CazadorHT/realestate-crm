import { Metadata } from "next";
import { PropertySearchPage } from "@/components/public/PropertySearchPage";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  const canonicalUrl = `${siteConfig.url}/properties`; // This line remains for the properties page
  return {
    title: t("metadata.search_title"), // This remains for the properties page
    description: t("metadata.search_description"), // This remains for the properties page
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "th-TH": `${canonicalUrl}?lang=th`,
        "en-US": `${canonicalUrl}?lang=en`,
        "zh-CN": `${canonicalUrl}?lang=cn`,
        "ru-RU": `${canonicalUrl}?lang=ru`,
        "x-default": canonicalUrl,
      },
    },
  };
}

export default function PublicPropertiesPage() {
  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50 pt-(--nav-offset,64px) transition-[padding-top] duration-300 ease-in-out">
        <div className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 py-4">
          <AppBreadcrumbs />
        </div>
        <PropertySearchPage />
      </div>
    </>
  );
}
