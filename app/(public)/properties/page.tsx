import { Metadata } from "next";
import { PropertySearchPage } from "@/components/public/PropertySearchPage";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import { getServerTranslations } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("metadata.search_title"),
    description: t("metadata.search_description"),
  };
}

export default function PublicPropertiesPage() {
  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50 mt-16">
        <div className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 py-4">
          <AppBreadcrumbs />
        </div>
        <PropertySearchPage />
      </div>
    </>
  );
}
