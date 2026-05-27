import { Suspense } from "react";
import { getServiceBySlug } from "@/features/services/actions";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  Phone,
  Eye,
  TrendingUp,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import Image from "next/image";
import { ServiceGalleryClient } from "./ServiceGalleryClient";
import { ServiceViewCounter } from "@/components/services/ServiceViewCounter";

export const revalidate = 60;

// Generate static params for all services
export async function generateStaticParams() {
  const { getServices } = await import("@/features/services/actions");
  const services = await getServices();
  const data = services.data || [];

  return data.map((service) => ({
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
  const localizedPrice = getLocaleValue(service, "price_range", language);

  // If we are NOT in Thai, and the value is still the default Thai string or empty,
  // we use the translation key for "Contact for price".
  const isThaiFallback = language !== "th" && 
    (localizedPrice.includes("สอบถามราคา") || !localizedPrice);

  const displayPrice = isThaiFallback
    ? t("common.contact_for_price")
    : localizedPrice;

  // Gallery splitting
  const gallery = service.gallery_images || [];
  const viewCount = (service as any).view_count || 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Silent Analytics Tracker: 11/10 Standard */}
      <ServiceViewCounter id={service.id} />

      {/* Hero Header */}
      <div className="relative h-[60vh] min-h-[500px] w-full overflow-hidden">
        {service.cover_image ? (
          <div className="absolute inset-0">
            <Image
              src={service.cover_image}
              alt={service.title}
              fill
              className="object-cover scale-105"
              priority
              sizes="100vw"
            />
          </div>
        ) : (
          <div className="w-full h-full bg-slate-900" />
        )}
        <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/30 to-white" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <Link
            href="/services"
            className="absolute top-8 left-4 md:left-8 text-white/80 hover:text-white flex items-center gap-2 transition-all py-2 px-5 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/20 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />{" "}
            {t("services_detail.back_to_services")}
          </Link>

          <div className="space-y-6 max-w-5xl">
             {/* Popularity Badge: Social Proof 11/10 */}
             {viewCount > 0 && (
               <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white animate-in fade-in slide-in-from-bottom-4 duration-700 mx-auto">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-black flex items-center gap-2">
                    <Eye className="w-3 h-3" />
                    {viewCount.toLocaleString()} {t("common.views")}
                    {viewCount > 100 && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                  </span>
               </div>
             )}

            <h1 className="text-5xl md:text-7xl font-black text-white drop-shadow-2xl leading-[1.1] tracking-tight">
              {title}
            </h1>

            {displayPrice && (
              <div className="inline-block mt-4 px-8 py-3 rounded-2xl bg-amber-400 text-amber-950 font-black text-xl shadow-2xl shadow-amber-500/20 transform -rotate-1">
                {displayPrice}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 -mt-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description Card: Elite Design */}
            <div className="bg-white/90 backdrop-blur-xl rounded-[40px] p-10 shadow-2xl shadow-slate-200/50 border border-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 text-slate-100 -mr-4 -mt-4">
                 <ShieldAlert className="w-32 h-32 rotate-12 opacity-5 pointer-events-none" />
              </div>
              <div className="prose prose-lg max-w-none prose-slate prose-headings:font-black prose-a:text-blue-600 prose-img:rounded-3xl">
                <div
                  dangerouslySetInnerHTML={{
                    __html: content || description || "",
                  }}
                />
              </div>
            </div>

            {/* Gallery Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <div className="h-px bg-slate-100 flex-1" />
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                  {t("services_detail.gallery")}
                </h2>
                <div className="h-px bg-slate-100 flex-1" />
              </div>
              <ServiceGalleryClient
                images={gallery}
                title={title}
                galleryLabel=""
              />
            </div>
          </div>

          {/* Sidebar CTA */}
          <div className="space-y-8 h-fit sticky top-24">
            <div className="bg-slate-900 rounded-[40px] p-8 shadow-2xl shadow-blue-900/10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Phone className="w-24 h-24 rotate-12" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-3">
                  {t("services_detail.interested")}
                </h3>
                <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                  {t("services_detail.interested_desc")}
                </p>

                <div className="space-y-4">
                  <a
                    href={service.contact_link || siteConfig.links.line}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full transition-transform active:scale-95"
                  >
                    <Button className="w-full h-14 text-lg bg-[#06C755] hover:bg-[#05b34c] text-white shadow-xl shadow-green-500/20 font-black rounded-2xl group">
                      <Phone className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform" />
                      {t("services_detail.contact_line")}
                    </Button>
                  </a>
                  {!service.contact_link && (
                    <Link href="/contact" className="block w-full transition-transform active:scale-95">
                      <Button
                        variant="outline"
                        className="w-full h-14 text-lg border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl"
                      >
                        {t("services_detail.other_channels")}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl">
              <h4 className="font-black text-slate-900 mb-6 uppercase tracking-tight text-sm">
                {t("services_detail.why_choose")}
              </h4>
              <ul className="space-y-4">
                {[
                  t("services_detail.verified_trusted"),
                  t("services_detail.quality_guaranteed"),
                  t("services_detail.premium_standards")
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4 text-slate-600 group">
                    <div className="p-1 rounded-full bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                       <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    </div>
                    <span className="text-sm font-medium pt-0.5">
                      {item}
                    </span>
                  </li>
                ))}
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
  const canonicalUrl = `${siteConfig.url}/services/${encodeURIComponent(slug)}`;

  return {
    title: `${title} | Premium Services`,
    description: description || `Explore our ${title} service.`,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        th: `${siteConfig.url}/th/services/${encodeURIComponent(slug)}`,
        en: `${siteConfig.url}/en/services/${encodeURIComponent(slug)}`,
        "zh-Hans": `${siteConfig.url}/cn/services/${encodeURIComponent(slug)}`,
        ru: `${siteConfig.url}/ru/services/${encodeURIComponent(slug)}`,
        "x-default": canonicalUrl,
      },
    },
    openGraph: {
      url: canonicalUrl,
      images: service.cover_image ? [service.cover_image] : [],
    },
  };
}

export default function ServiceDetailPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm font-bold text-slate-400 animate-pulse tracking-widest uppercase">Initializing Asset...</p>
        </div>
      }
    >
      <ServiceDetail {...props} />
    </Suspense>
  );
}
