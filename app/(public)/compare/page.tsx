import { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { siteConfig } from "@/lib/site-config";
import { getSeoAlternates } from "@/lib/seo-utils";
import { getServerTranslations } from "@/lib/i18n";
import { CompareLoadingSkeleton } from "@/components/public/compare/CompareLoadingSkeleton";

// 🚀 Zero-SSR Client-Only Component to prevent any server-side bailout or 500 status on Vercel
const ComparePageClient = nextDynamic(() => import("./ComparePageClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-50 pb-12 md:pb-20 pt-20 md:pt-24 max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8">
      <div className="h-8 w-48 bg-slate-200/80 rounded-xl animate-pulse mb-6" />
      <CompareLoadingSkeleton count={3} />
    </div>
  ),
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();

  const title = t("metadata.compare_title", { siteName: siteConfig.name });
  const description = t("metadata.compare_description");

  return {
    title: {
      absolute: title,
    },
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
