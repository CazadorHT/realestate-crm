import { Suspense } from "react";
import { getServiceBySlug } from "@/features/services/actions";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  Phone,
  LineChart,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { ServiceGalleryClient } from "./ServiceGalleryClient";

export const revalidate = 60;

// Generate static params for all services
export async function generateStaticParams() {
  const { getServices } = await import("@/features/services/actions");
  const services = await getServices();

  return services.map((service) => ({
    slug: service.slug,
  }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function ServiceDetail({ params }: PageProps) {
  const { slug } = await params;
  const { language, t } = await getServerTranslations();
  const service = await getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  // Localized values
  const title = getLocaleValue(service, "title", language);
  const description = getLocaleValue(service, "description", language);
  const content = getLocaleValue(service, "content", language);
  const isContactForPrice = service.price_range === "สอบถามราคา";
  const displayPrice = isContactForPrice
    ? t("common.contact_for_price")
    : service.price_range;

  // Gallery splitting
  const gallery = service.gallery_images || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
        {service.cover_image ? (
          <img
            src={service.cover_image}
            alt={service.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-900" />
        )}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <Link
            href="/services"
            className="absolute top-8 left-4 md:left-8 text-white/80 hover:text-white flex items-center gap-2 transition-colors py-2 px-4 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10"
          >
            <ArrowLeft className="h-4 w-4" />{" "}
            {t("services_detail.back_to_services")}
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg max-w-4xl leading-tight">
            {title}
          </h1>
          {displayPrice && (
            <div className="mt-4 px-6 py-2 rounded-full bg-yellow-400/90 text-yellow-950 font-bold text-lg shadow-lg backdrop-blur-sm">
              {displayPrice}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description Card */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
              <div className="prose prose-lg max-w-none prose-slate prose-headings:font-bold prose-a:text-blue-600">
                <div
                  dangerouslySetInnerHTML={{
                    __html: content || description || "",
                  }}
                />
              </div>
            </div>

            {/* Gallery Section */}
            <ServiceGalleryClient
              images={gallery}
              title={title}
              galleryLabel={t("services_detail.gallery")}
            />
          </div>

          {/* Sidebar CTA */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 h-fit sticky top-24 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {t("services_detail.interested")}
              </h3>
              <p className="text-slate-500">
                {t("services_detail.interested_desc")}
              </p>
            </div>

            <div className="space-y-3">
              <a
                href={service.contact_link || siteConfig.links.line}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <Button className="w-full h-12 text-lg bg-[#06C755] hover:bg-[#05b34c] text-white shadow-lg shadow-green-500/20 font-bold">
                  <Phone className="mr-2 h-5 w-5" />
                  {t("services_detail.contact_line")}
                </Button>
              </a>
              {!service.contact_link && (
                <Link href="/contact" className="block w-full">
                  <Button
                    variant="outline"
                    className="w-full h-12 text-lg border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    {t("services_detail.other_channels")}
                  </Button>
                </Link>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h4 className="font-semibold text-slate-900 mb-4">
                {t("services_detail.why_choose")}
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-slate-600">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="text-sm">
                    {t("services_detail.verified_trusted")}
                  </span>
                </li>
                <li className="flex items-start gap-3 text-slate-600">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="text-sm">
                    {t("services_detail.quality_guaranteed")}
                  </span>
                </li>
                <li className="flex items-start gap-3 text-slate-600">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="text-sm">
                    {t("services_detail.premium_standards")}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { language } = await getServerTranslations();
  const service = await getServiceBySlug(slug);
  if (!service) return { title: "Service Not Found" };

  const title = getLocaleValue(service, "title", language);
  const description = getLocaleValue(service, "description", language);

  return {
    title: `${title} | Premium Services`,
    description: description || `Explore our ${title} service.`,
    openGraph: {
      images: service.cover_image ? [service.cover_image] : [],
    },
  };
}

export default function ServiceDetailPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ServiceDetail {...props} />
    </Suspense>
  );
}
